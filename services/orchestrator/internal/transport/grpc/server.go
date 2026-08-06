package grpc

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"clickify-mate/services/orchestrator/internal/repository"
	"github.com/google/uuid"
)

type AgentOrchestratorServerImpl struct {
	UnimplementedAgentOrchestratorServer
	Redis *repository.RedisRepository
}

type QueuedEvent struct {
	EventID    string                 `json:"event_id"`
	Platform   string                 `json:"platform"`
	AgentID    string                 `json:"agent_id"`
	Payload    map[string]interface{} `json:"payload"`
	ReceivedAt time.Time              `json:"received_at"`
}

func NewAgentOrchestratorServer(redis *repository.RedisRepository) *AgentOrchestratorServerImpl {
	return &AgentOrchestratorServerImpl{
		Redis: redis,
	}
}

func (s *AgentOrchestratorServerImpl) ProcessEvent(ctx context.Context, req *EventRequest) (*EventResponse, error) {
	eventID := req.EventId
	if eventID == "" {
		eventID = uuid.New().String()
	}

	var payload map[string]interface{}
	if req.PayloadJson != "" {
		if err := json.Unmarshal([]byte(req.PayloadJson), &payload); err != nil {
			payload = map[string]interface{}{"raw_payload": req.PayloadJson}
		}
	} else {
		payload = map[string]interface{}{
			"content":      req.Content,
			"sender_id":    req.SenderId,
			"message_type": req.MessageType,
		}
	}

	event := QueuedEvent{
		EventID:    eventID,
		Platform:   req.Platform,
		AgentID:    req.AgentId,
		Payload:    payload,
		ReceivedAt: time.Now(),
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		return &EventResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("failed to serialize event: %v", err),
		}, nil
	}

	// Enqueue to Redis
	redisCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	err = s.Redis.Client.LPush(redisCtx, "webhook_queue", eventJSON).Err()
	if err != nil {
		return &EventResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("message broker error: %v", err),
		}, nil
	}

	return &EventResponse{
		Success:   true,
		ReplyText: "Event queued successfully via gRPC",
	}, nil
}

func (s *AgentOrchestratorServerImpl) CheckStock(ctx context.Context, req *StockRequest) (*StockResponse, error) {
	sku := req.Sku
	if sku == "" {
		return &StockResponse{Exists: false}, nil
	}

	// Mock catalog
	var name string
	var stock int32
	var price float64
	var exists bool

	switch sku {
	case "PRO-AI-01":
		name = "Premium AI Copilot Access"
		stock = 99
		price = 1200.0
		exists = true
	case "PRO-AI-02":
		name = "Clickify Mate Starter Kit"
		stock = 15
		price = 450.0
		exists = true
	default:
		// Attempt to check Redis cache if any
		val, err := s.Redis.Client.Get(ctx, fmt.Sprintf("stock:%s", sku)).Result()
		if err == nil && val != "" {
			var cached struct {
				Name  string  `json:"name"`
				Stock int32   `json:"stock"`
				Price float64 `json:"price"`
			}
			if json.Unmarshal([]byte(val), &cached) == nil {
				return &StockResponse{
					Exists: true,
					Name:   cached.Name,
					Stock:  cached.Stock,
					Price:  cached.Price,
				}, nil
			}
		}
		
		return &StockResponse{
			Exists: false,
			Stock:  0,
			Price:  0.0,
		}, nil
	}

	return &StockResponse{
		Exists: exists,
		Name:   name,
		Stock:  stock,
		Price:  price,
	}, nil
}
