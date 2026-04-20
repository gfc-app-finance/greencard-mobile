package repository

import "fmt"

func restStatusError(operation string, statusCode int) error {
	return fmt.Errorf("%s failed with status %d", operation, statusCode)
}
