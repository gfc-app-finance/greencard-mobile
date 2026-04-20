package middleware

import (
	"context"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

const authenticatedUserContextKey contextKey = "authenticated_user"

func WithAuthenticatedUser(ctx context.Context, user model.AuthenticatedUser) context.Context {
	return context.WithValue(ctx, authenticatedUserContextKey, user)
}

func GetAuthenticatedUser(ctx context.Context) (model.AuthenticatedUser, bool) {
	user, ok := ctx.Value(authenticatedUserContextKey).(model.AuthenticatedUser)
	return user, ok
}
