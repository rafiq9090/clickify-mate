package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"strconv"
	"sync/atomic"
	"time"

	"clickify-mate/services/orchestrator/internal/repository"
	transportGrpc "clickify-mate/services/orchestrator/internal/transport/grpc"
	transport "clickify-mate/services/orchestrator/internal/transport/http"

	"google.golang.org/grpc"
)

var (
	redisAddr     = getEnv("REDIS_ADDR", "localhost:6379")
	redisPassword = getEnv("REDIS_PASSWORD", "")
	redisDB       = getEnvInt("REDIS_DB", 0)
	port          = getEnv("PORT", "5001")
	grpcPort      = getEnv("GRPC_PORT", "5003")
	verifyToken   = getEnv("VERIFY_TOKEN", "papersnap_secure_verify")

	// Microservice routing targets
	whatsappForwardURL = getEnv("WHATSAPP_FORWARD_URL", "http://localhost:8000/webhook/whatsapp")
	telegramForwardURL = getEnv("TELEGRAM_FORWARD_URL", "http://localhost:3000/api/agents/telegram")
	facebookForwardURL = getEnv("FACEBOOK_FORWARD_URL", "http://localhost:3000/api/agents/facebook")
)

func main() {
	fmt.Println("=== Starting Telegraph Ingestor & Orchestrator Daemon ===")

	// 1. Establish connection to Redis
	redisRepo, err := repository.NewRedisRepository(redisAddr, redisPassword, redisDB)
	if err != nil {
		fmt.Printf("[-] Failed to connect to Redis at %s: %v\n", redisAddr, err)
		os.Exit(1)
	}
	fmt.Printf("[+] Connected to Redis at %s\n", redisAddr)

	// 2. Spawn concurrent worker pool
	workerCount := getEnvInt("WORKER_POOL_SIZE", 10)
	for i := 0; i < workerCount; i++ {
		go startWorker(i, redisRepo)
	}
	fmt.Printf("[+] Spooled %d asynchronous queue processing workers\n", workerCount)

	// 3. Register HTTP routes
	webhookHandler := transport.NewWebhookHandler(redisRepo, verifyToken)

	http.HandleFunc("/webhook/whatsapp", webhookHandler.HandleWebhook("whatsapp"))
	http.HandleFunc("/webhook/telegram", webhookHandler.HandleWebhook("telegram"))
	http.HandleFunc("/webhook/facebook", webhookHandler.HandleWebhook("facebook"))

	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		atomic.AddUint64(&transport.HttpRequestsTotal, 1)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","engine":"go","version":"go1.26.0"}`))
	})

	http.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		atomic.AddUint64(&transport.HttpRequestsTotal, 1)
		w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
		fmt.Fprintf(w,
			"# HELP http_requests_total Total number of HTTP requests processed\n"+
			"# TYPE http_requests_total counter\n"+
			"http_requests_total %d\n\n"+
			"# HELP events_queued_total Total number of webhook events successfully queued in Redis\n"+
			"# TYPE events_queued_total counter\n"+
			"events_queued_total %d\n\n"+
			"# HELP delivery_success_total Total number of webhook events successfully delivered to downstream targets\n"+
			"# TYPE delivery_success_total counter\n"+
			"delivery_success_total %d\n\n"+
			"# HELP delivery_failed_total Total number of webhook delivery failures\n"+
			"# TYPE delivery_failed_total counter\n"+
			"delivery_failed_total %d\n",
			atomic.LoadUint64(&transport.HttpRequestsTotal),
			atomic.LoadUint64(&transport.EventsQueuedTotal),
			atomic.LoadUint64(&transport.DeliverySuccessTotal),
			atomic.LoadUint64(&transport.DeliveryFailedTotal),
		)
	})

	// 4. Start gRPC Server in background
	go func() {
		lis, err := net.Listen("tcp", ":"+grpcPort)
		if err != nil {
			fmt.Printf("[-] Failed to listen for gRPC on port :%s: %v\n", grpcPort, err)
			return
		}
		
		s := grpc.NewServer()
		orchestratorServer := transportGrpc.NewAgentOrchestratorServer(redisRepo)
		transportGrpc.RegisterAgentOrchestratorServer(s, orchestratorServer)
		
		fmt.Printf("[+] gRPC Orchestrator service listening on port :%s\n", grpcPort)
		if err := s.Serve(lis); err != nil {
			fmt.Printf("[-] gRPC Server exited with error: %v\n", err)
		}
	}()

	fmt.Printf("[+] Ingestion service listening on port :%s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		fmt.Printf("[-] Ingestion server exited with error: %v\n", err)
		os.Exit(1)
	}
}

func startWorker(id int, repo *repository.RedisRepository) {
	fmt.Printf("[Worker %d] Started event loop...\n", id)
	ctx := context.Background()
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	for {
		// Block pop new events from the queue
		results, err := repo.Client.BRPop(ctx, 0, "webhook_queue").Result()
		if err != nil {
			fmt.Printf("[Worker %d Error] Pop failed: %v\n", id, err)
			time.Sleep(1 * time.Second)
			continue
		}

		if len(results) < 2 {
			continue
		}

		eventJSON := results[1]
		var event transport.QueuedEvent
		if err := json.Unmarshal([]byte(eventJSON), &event); err != nil {
			fmt.Printf("[Worker %d Error] Unmarshal failed: %v\n", id, err)
			continue
		}

		fmt.Printf("[Worker %d] Processing event %s [Platform: %s]\n", id, event.EventID, event.Platform)

		// Determine callback target URL
		var targetURL string
		switch event.Platform {
		case "whatsapp":
			targetURL = whatsappForwardURL
		case "telegram":
			targetURL = telegramForwardURL
		case "facebook":
			targetURL = facebookForwardURL
		default:
			fmt.Printf("[Worker %d Warning] Unrecognized platform %s. Skipping.\n", id, event.Platform)
			continue
		}

		// Inject agent_id if present
		if event.AgentID != "" {
			if bytes.Contains([]byte(targetURL), []byte("?")) {
				targetURL += "&agent_id=" + event.AgentID
			} else {
				targetURL += "?agent_id=" + event.AgentID
			}
		}

		payloadBytes, err := json.Marshal(event.Payload)
		if err != nil {
			fmt.Printf("[Worker %d Error] Payload serialization failed: %v\n", id, err)
			continue
		}

		// Dispatch request
		req, err := http.NewRequest("POST", targetURL, bytes.NewBuffer(payloadBytes))
		if err != nil {
			fmt.Printf("[Worker %d Error] Request build failed: %v\n", id, err)
			continue
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Telegraph-Event-ID", event.EventID)

		resp, err := client.Do(req)
		if err != nil {
			atomic.AddUint64(&transport.DeliveryFailedTotal, 1)
			fmt.Printf("[Worker %d Error] Delivery to %s failed: %v\n", id, targetURL, err)
			continue
		}

		bodyText, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode >= 400 {
			atomic.AddUint64(&transport.DeliveryFailedTotal, 1)
		} else {
			atomic.AddUint64(&transport.DeliverySuccessTotal, 1)
		}

		fmt.Printf("[Worker %d] Delivery to %s finished with status: %d (Response: %s)\n", id, targetURL, resp.StatusCode, string(bodyText))
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) int {
	valStr := getEnv(key, "")
	if val, err := strconv.Atoi(valStr); err == nil {
		return val
	}
	return defaultVal
}
