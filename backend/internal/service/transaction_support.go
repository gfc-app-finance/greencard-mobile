package service

import (
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func convertAmount(sourceCurrency, destinationCurrency model.AccountCurrency, amount float64) (float64, *float64) {
	amount = roundTo2(amount)
	if sourceCurrency == destinationCurrency {
		return amount, nil
	}

	rate := lookupFXRate(sourceCurrency, destinationCurrency)
	destinationAmount := roundTo2(amount * rate)

	return destinationAmount, &rate
}

func lookupFXRate(sourceCurrency, destinationCurrency model.AccountCurrency) float64 {
	rates := map[string]float64{
		"NGN:USD": 0.00064,
		"USD:NGN": 1560.00,
		"NGN:GBP": 0.00051,
		"GBP:NGN": 1980.00,
		"NGN:EUR": 0.00059,
		"EUR:NGN": 1700.00,
		"USD:GBP": 0.79,
		"GBP:USD": 1.27,
		"USD:EUR": 0.92,
		"EUR:USD": 1.09,
		"GBP:EUR": 1.16,
		"EUR:GBP": 0.86,
	}

	key := fmt.Sprintf("%s:%s", sourceCurrency, destinationCurrency)
	if rate, ok := rates[key]; ok {
		return rate
	}

	return 1
}

func mockPaymentFee(paymentType model.PaymentType, currency model.AccountCurrency) float64 {
	switch paymentType {
	case model.PaymentTypeInternational:
		switch currency {
		case model.AccountCurrencyNGN:
			return 1500
		case model.AccountCurrencyUSD:
			return 2.50
		case model.AccountCurrencyGBP:
			return 2.00
		case model.AccountCurrencyEUR:
			return 2.30
		default:
			return 0
		}
	default:
		return 0
	}
}

func newTransactionReference(prefix, userID string) string {
	return fmt.Sprintf("GCF-%s-%s-%s", prefix, strings.ToUpper(seedAccountKey(userID)[:4]), time.Now().UTC().Format("20060102150405"))
}

func roundTo2(value float64) float64 {
	return math.Round(value*100) / 100
}

func timePointer(value time.Time) *time.Time {
	return &value
}
