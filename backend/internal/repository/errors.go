package repository

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
)

var (
	ErrInsufficientFunds     = errors.New("insufficient funds")
	ErrMovementStateConflict = errors.New("movement state conflict")
	ErrWebhookEventConflict  = errors.New("webhook event conflict")
)

type postgrestError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details"`
	Hint    string `json:"hint"`
}

func restStatusError(operation string, statusCode int) error {
	return fmt.Errorf("%s failed with status %d", operation, statusCode)
}

func rpcStatusError(operation string, response *http.Response) error {
	payload, err := io.ReadAll(response.Body)
	if err == nil {
		var apiError postgrestError
		if unmarshalErr := json.Unmarshal(payload, &apiError); unmarshalErr == nil {
			message := strings.TrimSpace(strings.ToLower(apiError.Message))
			switch message {
			case "insufficient_funds":
				return ErrInsufficientFunds
			case "movement_state_conflict":
				return ErrMovementStateConflict
			}
		}
	}

	return fmt.Errorf("%s failed with status %d", operation, response.StatusCode)
}
