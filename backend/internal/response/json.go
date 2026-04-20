package response

import (
	"encoding/json"
	"net/http"
)

type ErrorEnvelope struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code      string                 `json:"code"`
	Message   string                 `json:"message"`
	RequestID string                 `json:"request_id,omitempty"`
	Fields    []ValidationFieldError `json:"fields,omitempty"`
}

type ValidationFieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func JSON(w http.ResponseWriter, statusCode int, payload any) error {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)

	return json.NewEncoder(w).Encode(payload)
}

func Error(w http.ResponseWriter, statusCode int, code, message, requestID string) {
	_ = JSON(w, statusCode, ErrorEnvelope{
		Error: ErrorDetail{
			Code:      code,
			Message:   message,
			RequestID: requestID,
		},
	})
}

func Validation(w http.ResponseWriter, statusCode int, code, message, requestID string, fields []ValidationFieldError) {
	_ = JSON(w, statusCode, ErrorEnvelope{
		Error: ErrorDetail{
			Code:      code,
			Message:   message,
			RequestID: requestID,
			Fields:    fields,
		},
	})
}
