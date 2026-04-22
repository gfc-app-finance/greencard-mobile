package worker

import (
	"context"
	"io"
	"log/slog"
	"sync"
	"time"
)

type Result struct {
	Checked         int
	Updated         int
	TimedOut        int
	RetryCandidates int
}

type Job interface {
	Name() string
	Run(ctx context.Context) (Result, error)
}

type namedJob struct {
	name string
	run  func(ctx context.Context) (Result, error)
}

func (j namedJob) Name() string {
	return j.name
}

func (j namedJob) Run(ctx context.Context) (Result, error) {
	return j.run(ctx)
}

type Engine struct {
	logger       *slog.Logger
	pollInterval time.Duration
	jobs         []Job
	wg           sync.WaitGroup
}

func NewEngine(logger *slog.Logger, pollInterval time.Duration, jobs ...Job) *Engine {
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}

	filteredJobs := make([]Job, 0, len(jobs))
	for _, job := range jobs {
		if job == nil {
			continue
		}

		filteredJobs = append(filteredJobs, job)
	}

	if pollInterval <= 0 {
		pollInterval = 15 * time.Second
	}

	return &Engine{
		logger:       logger,
		pollInterval: pollInterval,
		jobs:         filteredJobs,
	}
}

func (e *Engine) Start(ctx context.Context) {
	if e == nil || len(e.jobs) == 0 {
		return
	}

	e.logger.Info(
		"starting background worker engine",
		slog.Duration("poll_interval", e.pollInterval),
		slog.Int("job_count", len(e.jobs)),
	)

	e.wg.Add(1)
	go func() {
		defer e.wg.Done()

		ticker := time.NewTicker(e.pollInterval)
		defer ticker.Stop()

		if ctx.Err() != nil {
			e.logger.Info("background worker engine stopping")
			return
		}

		e.runOnce(ctx)

		for {
			select {
			case <-ctx.Done():
				e.logger.Info("background worker engine stopping")
				return
			case <-ticker.C:
				e.runOnce(ctx)
			}
		}
	}()
}

func (e *Engine) Wait() {
	if e == nil {
		return
	}

	e.wg.Wait()
}

func (e *Engine) runOnce(ctx context.Context) {
	for _, job := range e.jobs {
		startedAt := time.Now()
		e.logger.Info("worker job started", slog.String("job", job.Name()))

		result, err := job.Run(ctx)
		duration := time.Since(startedAt)
		if err != nil {
			e.logger.Error(
				"worker job failed",
				slog.String("job", job.Name()),
				slog.Duration("duration", duration),
				slog.Int("checked", result.Checked),
				slog.Int("updated", result.Updated),
				slog.Int("timed_out", result.TimedOut),
				slog.Int("retry_candidates", result.RetryCandidates),
				slog.String("error", err.Error()),
			)
			continue
		}

		e.logger.Info(
			"worker job finished",
			slog.String("job", job.Name()),
			slog.Duration("duration", duration),
			slog.Int("checked", result.Checked),
			slog.Int("updated", result.Updated),
			slog.Int("timed_out", result.TimedOut),
			slog.Int("retry_candidates", result.RetryCandidates),
		)
	}
}
