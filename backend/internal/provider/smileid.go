package provider

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
)

const (
	SmileIDProviderName = "smileid"
	smileIDJobType      = 5
	smileIDSignatureTag = "sid_request"
)

type SmileIDClient struct {
	logger            *slog.Logger
	httpClient        *http.Client
	partnerID         string
	apiKey            string
	baseURL           string
	sourceSDKVersion  string
	now               func() time.Time
	idVerificationURL string
}

type smileIDRequest struct {
	PartnerID        string                 `json:"partner_id"`
	SourceSDK        string                 `json:"source_sdk"`
	SourceSDKVersion string                 `json:"source_sdk_version"`
	Signature        string                 `json:"signature"`
	Timestamp        string                 `json:"timestamp"`
	Country          string                 `json:"country"`
	IDType           string                 `json:"id_type"`
	IDNumber         string                 `json:"id_number"`
	FirstName        string                 `json:"first_name,omitempty"`
	MiddleName       string                 `json:"middle_name,omitempty"`
	LastName         string                 `json:"last_name,omitempty"`
	DOB              string                 `json:"dob,omitempty"`
	PhoneNumber      string                 `json:"phone_number,omitempty"`
	PartnerParams    smileIDPartnerParams   `json:"partner_params"`
	Extra            map[string]interface{} `json:"-"`
}

type smileIDPartnerParams struct {
	JobID   string `json:"job_id"`
	UserID  string `json:"user_id"`
	JobType int    `json:"job_type"`
}

type smileIDResponse struct {
	Actions       map[string]string    `json:"Actions"`
	Country       string               `json:"Country"`
	DOB           string               `json:"DOB"`
	FullName      string               `json:"FullName"`
	IDNumber      string               `json:"IDNumber"`
	IDType        string               `json:"IDType"`
	PartnerParams smileIDPartnerParams `json:"PartnerParams"`
	ResultCode    string               `json:"ResultCode"`
	ResultText    string               `json:"ResultText"`
	SmileJobID    string               `json:"SmileJobID"`
	Success       *bool                `json:"success,omitempty"`
	Signature     string               `json:"signature"`
	Timestamp     string               `json:"timestamp"`
}

func NewSmileIDClient(logger *slog.Logger, cfg config.SmileIDConfig) (*SmileIDClient, error) {
	cfg.BaseURL = strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/")
	cfg.PartnerID = strings.TrimSpace(cfg.PartnerID)
	cfg.APIKey = strings.TrimSpace(cfg.APIKey)
	cfg.SourceSDKVersion = strings.TrimSpace(cfg.SourceSDKVersion)
	if cfg.SourceSDKVersion == "" {
		cfg.SourceSDKVersion = "greencard-go-1.0"
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 10 * time.Second
	}
	if cfg.PartnerID == "" || cfg.APIKey == "" || cfg.BaseURL == "" {
		return nil, ErrProviderMisconfigured
	}
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}

	client := &SmileIDClient{
		logger:           logger,
		httpClient:       &http.Client{Timeout: cfg.Timeout},
		partnerID:        cfg.PartnerID,
		apiKey:           cfg.APIKey,
		baseURL:          cfg.BaseURL,
		sourceSDKVersion: cfg.SourceSDKVersion,
		now: func() time.Time {
			return time.Now().UTC()
		},
	}
	client.idVerificationURL = client.baseURL + "/v1/id_verification"

	return client, nil
}

func (c *SmileIDClient) VerifyIdentity(ctx context.Context, request IdentityVerificationRequest) (IdentityVerificationResult, error) {
	request = normalizeIdentityRequest(request)
	if err := validateIdentityRequest(request); err != nil {
		return IdentityVerificationResult{}, err
	}

	timestamp := c.now().UTC().Format(time.RFC3339Nano)
	payload := smileIDRequest{
		PartnerID:        c.partnerID,
		SourceSDK:        "rest_api",
		SourceSDKVersion: c.sourceSDKVersion,
		Signature:        GenerateSmileIDSignature(timestamp, c.partnerID, c.apiKey),
		Timestamp:        timestamp,
		Country:          request.Country,
		IDType:           request.IDType,
		IDNumber:         request.IDNumber,
		FirstName:        request.FirstName,
		MiddleName:       request.MiddleName,
		LastName:         request.LastName,
		DOB:              request.DateOfBirth,
		PhoneNumber:      request.PhoneNumber,
		PartnerParams: smileIDPartnerParams{
			JobID:   request.JobID,
			UserID:  request.UserID,
			JobType: smileIDJobType,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return IdentityVerificationResult{}, err
	}

	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, c.idVerificationURL, bytes.NewReader(body))
	if err != nil {
		return IdentityVerificationResult{}, err
	}
	httpRequest.Header.Set("Accept", "application/json")
	httpRequest.Header.Set("Content-Type", "application/json")

	response, err := c.httpClient.Do(httpRequest)
	if err != nil {
		return IdentityVerificationResult{}, ProviderError{Provider: SmileIDProviderName, Temporary: true, Cause: ErrProviderUnavailable}
	}
	defer response.Body.Close()

	rawBody, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
	if err != nil {
		return IdentityVerificationResult{}, ProviderError{Provider: SmileIDProviderName, Temporary: true, Cause: ErrProviderUnavailable}
	}

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return IdentityVerificationResult{}, c.mapHTTPError(response.StatusCode, rawBody)
	}

	var providerResponse smileIDResponse
	if err := json.Unmarshal(rawBody, &providerResponse); err != nil {
		return IdentityVerificationResult{}, ProviderError{Provider: SmileIDProviderName, Code: "invalid_response", Temporary: true, Cause: ErrProviderUnavailable}
	}

	result := mapSmileIDResponse(request.JobID, providerResponse)
	c.logger.Info(
		"smile id verification completed",
		slog.String("provider", SmileIDProviderName),
		slog.String("job_id", request.JobID),
		slog.String("provider_reference", result.ProviderReference),
		slog.String("decision", string(result.Decision)),
		slog.String("result_code", result.ResultCode),
	)

	return result, nil
}

func (c *SmileIDClient) VerifyCallbackSignature(signature, timestamp string) bool {
	return ConfirmSmileIDSignature(signature, timestamp, c.partnerID, c.apiKey)
}

func (c *SmileIDClient) mapHTTPError(statusCode int, rawBody []byte) error {
	code := fmt.Sprintf("http_%d", statusCode)
	if providerCode := extractSmileIDResultCode(rawBody); providerCode != "" {
		code = providerCode
	}

	switch statusCode {
	case http.StatusUnauthorized, http.StatusForbidden:
		return ProviderError{Provider: SmileIDProviderName, Code: code, Cause: ErrProviderUnauthorized}
	case http.StatusBadRequest, http.StatusUnprocessableEntity:
		return ProviderError{Provider: SmileIDProviderName, Code: code, Cause: ErrProviderInvalidInput}
	default:
		return ProviderError{Provider: SmileIDProviderName, Code: code, Temporary: statusCode >= 500, Cause: ErrProviderUnavailable}
	}
}

func GenerateSmileIDSignature(timestamp, partnerID, apiKey string) string {
	mac := hmac.New(sha256.New, []byte(apiKey))
	mac.Write([]byte(timestamp))
	mac.Write([]byte(partnerID))
	mac.Write([]byte(smileIDSignatureTag))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

func ConfirmSmileIDSignature(signature, timestamp, partnerID, apiKey string) bool {
	expected := GenerateSmileIDSignature(timestamp, partnerID, apiKey)
	expectedBytes, err := base64.StdEncoding.DecodeString(expected)
	if err != nil {
		return false
	}
	receivedBytes, err := base64.StdEncoding.DecodeString(strings.TrimSpace(signature))
	if err != nil {
		return false
	}

	return subtle.ConstantTimeCompare(receivedBytes, expectedBytes) == 1
}

func mapSmileIDResponse(partnerJobID string, response smileIDResponse) IdentityVerificationResult {
	decision := IdentityDecisionError
	verifyAction := strings.TrimSpace(response.Actions["Verify_ID_Number"])
	switch {
	case response.ResultCode == "1012" || strings.EqualFold(verifyAction, "Verified"):
		decision = IdentityDecisionApproved
	case response.ResultCode == "1013" ||
		response.ResultCode == "1014" ||
		strings.EqualFold(verifyAction, "Not Verified"):
		decision = IdentityDecisionRejected
	case response.ResultCode == "1015" ||
		strings.Contains(strings.ToLower(response.ResultText), "unavailable"):
		decision = IdentityDecisionPending
	default:
		if response.Success != nil && *response.Success {
			decision = IdentityDecisionPending
		}
	}

	return IdentityVerificationResult{
		Provider:          SmileIDProviderName,
		ProviderReference: strings.TrimSpace(response.SmileJobID),
		PartnerJobID:      firstNonEmpty(response.PartnerParams.JobID, partnerJobID),
		Decision:          decision,
		ResultCode:        strings.TrimSpace(response.ResultCode),
		ResultText:        strings.TrimSpace(response.ResultText),
		FullName:          strings.TrimSpace(response.FullName),
		DateOfBirth:       strings.TrimSpace(response.DOB),
	}
}

func normalizeIdentityRequest(request IdentityVerificationRequest) IdentityVerificationRequest {
	request.UserID = strings.TrimSpace(request.UserID)
	request.JobID = strings.TrimSpace(request.JobID)
	request.Country = strings.ToUpper(strings.TrimSpace(request.Country))
	request.IDType = strings.ToUpper(strings.TrimSpace(request.IDType))
	request.IDNumber = strings.TrimSpace(request.IDNumber)
	request.FirstName = strings.TrimSpace(request.FirstName)
	request.MiddleName = strings.TrimSpace(request.MiddleName)
	request.LastName = strings.TrimSpace(request.LastName)
	request.DateOfBirth = strings.TrimSpace(request.DateOfBirth)
	request.PhoneNumber = strings.TrimSpace(request.PhoneNumber)
	return request
}

func validateIdentityRequest(request IdentityVerificationRequest) error {
	switch {
	case request.UserID == "":
		return ErrProviderInvalidInput
	case request.JobID == "":
		return ErrProviderInvalidInput
	case len(request.Country) != 2:
		return ErrProviderInvalidInput
	case request.IDType == "":
		return ErrProviderInvalidInput
	case request.IDNumber == "":
		return ErrProviderInvalidInput
	default:
		return nil
	}
}

func extractSmileIDResultCode(rawBody []byte) string {
	var payload struct {
		ResultCode string `json:"ResultCode"`
	}
	if err := json.Unmarshal(rawBody, &payload); err != nil {
		return ""
	}

	return strings.TrimSpace(payload.ResultCode)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}

	return ""
}

func IsProviderUnavailable(err error) bool {
	return errors.Is(err, ErrProviderUnavailable)
}
