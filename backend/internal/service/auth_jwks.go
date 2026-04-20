package service

import (
	"context"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/elliptic"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"
)

type jwksCache struct {
	mu        sync.RWMutex
	keys      map[string]any
	expiresAt time.Time
	cacheTTL  time.Duration
}

type jwksResponse struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	KeyID          string   `json:"kid"`
	Algorithm      string   `json:"alg"`
	KeyType        string   `json:"kty"`
	Curve          string   `json:"crv"`
	X              string   `json:"x"`
	Y              string   `json:"y"`
	Modulus        string   `json:"n"`
	Exponent       string   `json:"e"`
	KeyOperations  []string `json:"key_ops"`
	PublicKeyUsage string   `json:"use"`
}

func newJWKSCache(cacheTTL time.Duration) *jwksCache {
	return &jwksCache{
		keys:     make(map[string]any),
		cacheTTL: cacheTTL,
	}
}

func (c *jwksCache) GetKey(ctx context.Context, client *http.Client, jwksURL, keyID string) (any, error) {
	if key, ok := c.get(keyID); ok {
		return key, nil
	}

	keys, err := c.refresh(ctx, client, jwksURL)
	if err != nil {
		return nil, errRemoteValidationRequired
	}

	if keyID == "" && len(keys) == 1 {
		for _, key := range keys {
			return key, nil
		}
	}

	key, ok := keys[keyID]
	if !ok {
		return nil, errRemoteValidationRequired
	}

	return key, nil
}

func (c *jwksCache) get(keyID string) (any, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if time.Now().Before(c.expiresAt) {
		if keyID == "" && len(c.keys) == 1 {
			for _, key := range c.keys {
				return key, true
			}
		}

		key, ok := c.keys[keyID]
		return key, ok
	}

	return nil, false
}

func (c *jwksCache) refresh(ctx context.Context, client *http.Client, jwksURL string) (map[string]any, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, jwksURL, nil)
	if err != nil {
		return nil, err
	}

	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, response.Body)
		return nil, fmt.Errorf("jwks request failed with status %d", response.StatusCode)
	}

	var payload jwksResponse
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, err
	}

	keys := make(map[string]any)
	for _, rawKey := range payload.Keys {
		publicKey, err := rawKey.toPublicKey()
		if err != nil || rawKey.KeyID == "" {
			continue
		}

		keys[rawKey.KeyID] = publicKey
	}

	if len(keys) == 0 {
		return nil, errors.New("no asymmetric keys available")
	}

	c.mu.Lock()
	c.keys = keys
	c.expiresAt = time.Now().Add(c.cacheTTL)
	c.mu.Unlock()

	return keys, nil
}

func (k jwk) toPublicKey() (any, error) {
	if !canVerifyKey(k) {
		return nil, errors.New("jwk cannot be used for verification")
	}

	switch strings.ToUpper(k.KeyType) {
	case "RSA":
		return k.toRSAPublicKey()
	case "EC":
		return k.toECDSAPublicKey()
	case "OKP":
		return k.toEd25519PublicKey()
	default:
		return nil, fmt.Errorf("unsupported jwk type %q", k.KeyType)
	}
}

func (k jwk) toRSAPublicKey() (*rsa.PublicKey, error) {
	modulusBytes, err := decodeBase64URL(k.Modulus)
	if err != nil {
		return nil, err
	}

	exponentBytes, err := decodeBase64URL(k.Exponent)
	if err != nil {
		return nil, err
	}

	modulus := new(big.Int).SetBytes(modulusBytes)
	exponent := new(big.Int).SetBytes(exponentBytes)
	if exponent.Sign() <= 0 {
		return nil, errors.New("invalid rsa exponent")
	}

	return &rsa.PublicKey{
		N: modulus,
		E: int(exponent.Int64()),
	}, nil
}

func (k jwk) toECDSAPublicKey() (*ecdsa.PublicKey, error) {
	curve, err := ellipticCurve(k.Curve)
	if err != nil {
		return nil, err
	}

	xBytes, err := decodeBase64URL(k.X)
	if err != nil {
		return nil, err
	}

	yBytes, err := decodeBase64URL(k.Y)
	if err != nil {
		return nil, err
	}

	publicKey := &ecdsa.PublicKey{
		Curve: curve,
		X:     new(big.Int).SetBytes(xBytes),
		Y:     new(big.Int).SetBytes(yBytes),
	}

	if !publicKey.Curve.IsOnCurve(publicKey.X, publicKey.Y) {
		return nil, errors.New("invalid ecdsa public key")
	}

	return publicKey, nil
}

func (k jwk) toEd25519PublicKey() (ed25519.PublicKey, error) {
	if strings.TrimSpace(k.Curve) != "Ed25519" {
		return nil, fmt.Errorf("unsupported okp curve %q", k.Curve)
	}

	publicKeyBytes, err := decodeBase64URL(k.X)
	if err != nil {
		return nil, err
	}

	publicKey := ed25519.PublicKey(publicKeyBytes)
	if len(publicKey) != ed25519.PublicKeySize {
		return nil, errors.New("invalid ed25519 public key")
	}

	return publicKey, nil
}

func canVerifyKey(key jwk) bool {
	if key.PublicKeyUsage == "" || strings.EqualFold(key.PublicKeyUsage, "sig") {
		return true
	}

	for _, operation := range key.KeyOperations {
		if strings.EqualFold(operation, "verify") {
			return true
		}
	}

	return false
}

func decodeBase64URL(value string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(value)
}

func ellipticCurve(name string) (elliptic.Curve, error) {
	switch strings.TrimSpace(name) {
	case "P-256":
		return elliptic.P256(), nil
	case "P-384":
		return elliptic.P384(), nil
	case "P-521":
		return elliptic.P521(), nil
	default:
		return nil, fmt.Errorf("unsupported elliptic curve %q", name)
	}
}
