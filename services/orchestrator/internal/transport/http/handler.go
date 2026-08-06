package http

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync/atomic"
	"time"

	"clickify-mate/services/orchestrator/internal/repository"
	"github.com/google/uuid"
)

var (
	HttpRequestsTotal    uint64
	EventsQueuedTotal    uint64
	DeliverySuccessTotal uint64
	DeliveryFailedTotal  uint64
)

type WebhookHandler struct {
	Redis       *repository.RedisRepository
	VerifyToken string
}

type QueuedEvent struct {
	EventID    string                 `json:"event_id"`
	Platform   string                 `json:"platform"`
	AgentID    string                 `json:"agent_id"`
	Payload    map[string]interface{} `json:"payload"`
	ReceivedAt time.Time              `json:"received_at"`
}

func NewWebhookHandler(redis *repository.RedisRepository, verifyToken string) *WebhookHandler {
	return &WebhookHandler{
		Redis:       redis,
		VerifyToken: verifyToken,
	}
}

// VerifyMetaWebhook processes the GET challenge verification from Meta (WhatsApp & Facebook Messenger)
func (h *WebhookHandler) VerifyMetaWebhook(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("hub.mode")
	token := r.URL.Query().Get("hub.verify_token")
	challenge := r.URL.Query().Get("hub.challenge")

	if mode == "subscribe" && token == h.VerifyToken {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(challenge))
		return
	}

	w.WriteHeader(http.StatusForbidden)
	w.Write([]byte("Meta webhook verification failed"))
}

// HandleWebhook routes and queues incoming webhook events from Whatsapp, Facebook, or Telegram
func (h *WebhookHandler) HandleWebhook(platform string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		atomic.AddUint64(&HttpRequestsTotal, 1)

		// Route verification challenge requests (GET)
		if r.Method == http.MethodGet && (platform == "whatsapp" || platform == "facebook") {
			h.VerifyMetaWebhook(w, r)
			return
		}

		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		// Ingest request payload
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read request body", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		var payload map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &payload); err != nil {
			payload = map[string]interface{}{"raw_body": string(bodyBytes)}
		}

		agentID := r.URL.Query().Get("agent_id")

		// Create unified event envelope
		event := QueuedEvent{
			EventID:    uuid.New().String(),
			Platform:   platform,
			AgentID:    agentID,
			Payload:    payload,
			ReceivedAt: time.Now(),
		}

		eventJSON, err := json.Marshal(event)
		if err != nil {
			http.Error(w, "Failed to serialize event", http.StatusInternalServerError)
			return
		}

		// Enqueue into Redis in less than 1ms
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		err = h.Redis.Client.LPush(ctx, "webhook_queue", eventJSON).Err()
		if err != nil {
			fmt.Printf("[ORCHESTRATOR QUEUE ERROR] LPush failed for event %s: %v\n", event.EventID, err)
			http.Error(w, "Message broker unavailable", http.StatusServiceUnavailable)
			return
		}

		atomic.AddUint64(&EventsQueuedTotal, 1)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"success":true,"status":"queued"}`))
	}
}
