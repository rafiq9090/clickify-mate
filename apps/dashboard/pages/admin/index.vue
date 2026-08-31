<template>
  <div class="admin-dashboard-root">
    <!-- Header Title & Quick Metric Strip -->
    <div class="admin-page-header">
      <div>
        <h1 class="admin-title">Admin Console</h1>
        <p class="admin-subtitle">Autonomous Social Commerce &amp; Conversational AI Swarm Management</p>
      </div>

      <!-- Quick Action Controls -->
      <div class="header-actions">
        <button @click="refreshAllData" class="btn-secondary" :disabled="loading">
          <svg :class="{ 'spin-icon': loading }" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>{{ loading ? 'Syncing...' : 'Refresh Data' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Admin Workspace: Left Tab Navigation + Right Viewport -->
    <div class="admin-workspace-grid">
      <!-- Sidebar Tabs Navigation -->
      <aside class="admin-sidebar-nav">
        <div class="sidebar-card">
          <span class="nav-group-label">CONSOLE NAVIGATION</span>
          <nav class="nav-pills-list">
            <button 
              type="button" 
              class="nav-tab-pill" 
              :class="{ 'is-active': activeTab === 'overview' }"
              @click="activeTab = 'overview'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Overview &amp; Health</span>
            </button>

            <button 
              type="button" 
              class="nav-tab-pill" 
              :class="{ 'is-active': activeTab === 'agents' }"
              @click="activeTab = 'agents'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"></path>
                <path d="M18 14a6 6 0 0 1-12 0v-2h12v2z"></path>
                <circle cx="9" cy="6" r="1"></circle>
                <circle cx="15" cy="6" r="1"></circle>
              </svg>
              <span>AI Swarms &amp; Channels</span>
            </button>

            <button 
              type="button" 
              class="nav-tab-pill" 
              :class="{ 'is-active': activeTab === 'tokens' }"
              @click="activeTab = 'tokens'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span>Token Intelligence</span>
            </button>

            <button 
              type="button" 
              class="nav-tab-pill" 
              :class="{ 'is-active': activeTab === 'gaps' }"
              @click="activeTab = 'gaps'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Knowledge Gaps</span>
              <span v-if="knowledgeGaps.length" class="badge-counter">{{ knowledgeGaps.length }}</span>
            </button>

            <button 
              type="button" 
              class="nav-tab-pill" 
              :class="{ 'is-active': activeTab === 'inbox' }"
              @click="activeTab = 'inbox'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>Lead Inquiries</span>
              <span v-if="inboxMessages.length" class="badge-counter warning">{{ inboxMessages.length }}</span>
            </button>

            <button 
              type="button" 
              class="nav-tab-pill" 
              :class="{ 'is-active': activeTab === 'blog' }"
              @click="activeTab = 'blog'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Playbooks &amp; Blog</span>
            </button>

            <button 
              type="button" 
              class="nav-tab-pill" 
              :class="{ 'is-active': activeTab === 'feedback' }"
              @click="activeTab = 'feedback'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>User Reports &amp; Issues</span>
              <span v-if="openFeedbackCount" class="badge-counter warning">{{ openFeedbackCount }}</span>
            </button>

            <button 
              type="button" 
              class="nav-tab-pill" 
              :class="{ 'is-active': activeTab === 'config' }"
              @click="activeTab = 'config'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span>Global Config</span>
            </button>
          </nav>
        </div>
      </aside>

      <!-- Main Workspace Viewport -->
      <section class="admin-viewport">
        <!-- TAB 1: OVERVIEW & SYSTEM HEALTH -->
        <div v-if="activeTab === 'overview'" class="tab-pane">
          <!-- Timeframe Selector Bar (7D, 30D, 90D, 1 Year, 2 Years, Custom Range) -->
          <div class="analytics-timeframe-header mb-4">
            <div class="ath-main-row">
              <div class="ath-left">
                <span class="ath-label">Historical Timeframe:</span>
                <div class="timeframe-pills-group">
                  <button
                    v-for="tf in [
                      { id: '7d', label: '7 Days' },
                      { id: '30d', label: '30 Days' },
                      { id: '90d', label: '90 Days' },
                      { id: '1y', label: '1 Year (12 Mo)' },
                      { id: '2y', label: '2 Years (24 Mo)' }
                    ]"
                    :key="tf.id"
                    type="button"
                    :class="['tf-pill', { active: analyticsTimeframe === tf.id }]"
                    @click="changeAnalyticsTimeframe(tf.id)"
                  >
                    {{ tf.label }}
                  </button>

                  <!-- Custom Date Range Pill -->
                  <button
                    type="button"
                    :class="['tf-pill custom-pill', { active: analyticsTimeframe === 'custom' }]"
                    @click="toggleCustomDatePanel"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>{{ analyticsTimeframe === 'custom' && customDateRange.start && customDateRange.end ? `${customDateRange.start} → ${customDateRange.end}` : 'Custom Range' }}</span>
                  </button>
                </div>
              </div>
             
            </div>

            <!-- Custom Date Range Picker Drawer -->
            <div v-if="showCustomDatePanel || analyticsTimeframe === 'custom'" class="custom-date-drawer mt-3">
              <div class="cdd-inputs">
                <div class="cdd-field">
                  <label class="cdd-label">Start Date</label>
                  <input type="date" v-model="customDateRange.start" class="cdd-date-input" />
                </div>
                <span class="cdd-arrow">&rarr;</span>
                <div class="cdd-field">
                  <label class="cdd-label">End Date</label>
                  <input type="date" v-model="customDateRange.end" class="cdd-date-input" />
                </div>
                <button type="button" class="btn-apply-custom-range" @click="applyCustomDateRange">
                  Apply Date Range
                </button>
              </div>

              <!-- Quick Presets -->
              <div class="cdd-presets mt-2">
                <span class="cdd-presets-title">Quick Ranges:</span>
                <button type="button" class="cdd-preset-btn" @click="setCustomPreset('this_month')">This Month</button>
                <button type="button" class="cdd-preset-btn" @click="setCustomPreset('last_month')">Last Month</button>
                <button type="button" class="cdd-preset-btn" @click="setCustomPreset('last_6_months')">Last 6 Months</button>
                <button type="button" class="cdd-preset-btn" @click="setCustomPreset('ytd')">Year to Date (2026)</button>
                <button type="button" class="cdd-preset-btn" @click="setCustomPreset('year_2025')">Full Year 2025</button>
              </div>
            </div>
          </div>

          <!-- Top KPI Metrics -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-data">
                <span class="metric-label">Customer Conversations</span>
                <span class="metric-value">{{ conversationAnalytics.totalConversations.toLocaleString() }}</span>
                <span class="metric-subtext green">{{ analyticsTimeframe === '1y' || analyticsTimeframe === '2y' ? 'Total Unique Customers' : `${conversationAnalytics.todayConversations} active today` }}</span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-data">
                <span class="metric-label">Total Message Ingress</span>
                <span class="metric-value">{{ conversationAnalytics.totalInbound.toLocaleString() }}</span>
                <span class="metric-subtext">{{ analyticsTimeframe === '1y' || analyticsTimeframe === '2y' ? `Across past ${analyticsTimeframe === '2y' ? '24' : '12'} months` : `${conversationAnalytics.todayInbound} received today` }}</span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-data">
                <span class="metric-label">Automated AI Replies</span>
                <span class="metric-value">{{ conversationAnalytics.totalReplies.toLocaleString() }}</span>
                <span class="metric-subtext green">{{ conversationAnalytics.autonomousResolutionRate }}% autonomous resolution</span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-data">
                <span class="metric-label">Commerce Orders Handled</span>
                <span class="metric-value">{{ conversationAnalytics.totalOrdersHandled.toLocaleString() }}</span>
                <span class="metric-subtext">Avg. Latency: {{ conversationAnalytics.avgLatencyMs }}ms</span>
              </div>
            </div>
          </div>

          <!-- Channel Usage & Frequency Distribution ("Which Channel Used How Many Times") -->
          <div class="section-card mt-6">
            <div class="card-header-flex">
              <div>
                <h2 class="card-heading">Ingress Channel Utilization &amp; Frequency ({{ analyticsTimeframe.toUpperCase() }})</h2>
                <p class="card-desc">Traffic volume, customer sessions, and usage frequency per channel for the selected timeframe.</p>
              </div>
              <span class="tag-status online">{{ conversationAnalytics.activeChannelsCount }} Active Channels</span>
            </div>

            <div class="channels-analytics-grid mt-4">
              <div 
                v-for="chan in conversationAnalytics.channels" 
                :key="chan.id" 
                class="channel-analytics-card"
              >
                <div class="channel-card-top">
                  <div class="channel-brand-info">
                    <span class="channel-brand-name">{{ chan.name }}</span>
                  </div>
                  <span class="channel-share-badge">{{ chan.share }}% traffic</span>
                </div>

                <div class="channel-card-numbers">
                  <div class="ccn-item">
                    <span class="ccn-label">Total Messages</span>
                    <span class="ccn-value">{{ chan.messages.toLocaleString() }}</span>
                  </div>
                  <div class="ccn-item">
                    <span class="ccn-label">Customer Threads</span>
                    <span class="ccn-value">{{ chan.conversations.toLocaleString() }}</span>
                  </div>
                </div>

                <!-- Usage Progress Bar -->
                <div class="channel-progress-track">
                  <div class="channel-progress-bar" :style="{ width: `${chan.share}%`, background: chan.color }"></div>
                </div>

                <div class="channel-card-footer">
                  <span class="channel-status-pill">{{ chan.status }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Daily / Monthly Message Volume & AI Replies Tracker ("Day How Many Messages & Replies") -->
          <div class="section-card mt-6">
            <div class="card-header-flex">
              <div>
                <h2 class="card-heading">
                  {{ conversationAnalytics.isYearly ? `Monthly Message & Reply Telemetry (${analyticsTimeframe === '2y' ? '24 Months' : '12 Months'} Historical)` : `Daily Message Volume & AI Replies (${analyticsTimeframe.toUpperCase()} Activity)` }}
                </h2>
                <p class="card-desc">
                  {{ conversationAnalytics.isYearly ? 'Aggregated monthly time-series analytics stored in Firebase Firestore rollups.' : 'Day-by-day telemetry tracking incoming questions against AI-generated replies.' }}
                </p>
              </div>
              <div class="legend-pills">
                <span class="legend-pill inbound"><span class="lp-dot"></span> Inbound Messages</span>
                <span class="legend-pill reply"><span class="lp-dot"></span> AI Replies</span>
              </div>
            </div>

            <div class="daily-tracker-table-wrap mt-4">
              <table class="daily-tracker-table">
                <thead>
                  <tr>
                    <th>{{ conversationAnalytics.isYearly ? 'Month' : 'Date' }}</th>
                    <th>Inbound Messages (Customer)</th>
                    <th>AI Replies Sent</th>
                    <th>Customer Threads</th>
                    <th>Autonomous Rate</th>
                    <th>Volume Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in (conversationAnalytics.activityList || [])" :key="item.periodKey">
                    <td class="dt-date">
                      <strong>{{ item.displayLabel }}</strong>
                    </td>
                    <td>
                      <span class="dt-inbound-badge">+{{ item.inbound.toLocaleString() }} msgs</span>
                    </td>
                    <td>
                      <span class="dt-reply-badge">{{ item.replies.toLocaleString() }} replies</span>
                    </td>
                    <td>
                      <span class="dt-threads-badge">{{ item.conversations.toLocaleString() }} threads</span>
                    </td>
                    <td>
                      <span class="dt-rate-badge green">{{ item.resolutionRate }}</span>
                    </td>
                    <td class="dt-bar-cell">
                      <div class="dt-stacked-bar">
                        <div class="dt-bar-inbound" :style="{ width: `${Math.min((item.inbound / (item.inbound + item.replies || 1)) * 100, 60)}%` }" title="Inbound"></div>
                        <div class="dt-bar-reply" :style="{ width: `${Math.min((item.replies / (item.inbound + item.replies || 1)) * 100, 60)}%` }" title="AI Replies"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Services Status & Architecture Grid -->
          <div class="section-card mt-6">
            <h2 class="card-heading">Service Architecture &amp; Database Health</h2>
            <div class="services-status-grid mt-4">
              <div class="service-tile">
                <div class="service-icon">
                  <span class="pulse-dot green"></span>
                </div>
                <div class="service-info">
                  <span class="service-name">PostgreSQL Database</span>
                  <span class="service-status">Connected (Auth &amp; Users)</span>
                </div>
              </div>

              <div class="service-tile">
                <div class="service-icon">
                  <span class="pulse-dot green"></span>
                </div>
                <div class="service-info">
                  <span class="service-name">Firebase Firestore</span>
                  <span class="service-status">Operational (Blogs &amp; Schedules)</span>
                </div>
              </div>

              <div class="service-tile">
                <div class="service-icon">
                  <span class="pulse-dot green"></span>
                </div>
                <div class="service-info">
                  <span class="service-name">Groq Llama 3.3 Engine</span>
                  <span class="service-status">Fast Edge Inference Active</span>
                </div>
              </div>

              <div class="service-tile">
                <div class="service-icon">
                  <span class="pulse-dot green"></span>
                </div>
                <div class="service-info">
                  <span class="service-name">Backblaze B2 Storage</span>
                  <span class="service-status">Cloud Media S3 Bucket</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: AI SWARMS & CHANNELS -->
        <div v-if="activeTab === 'agents'" class="tab-pane">
          <!-- Architecture Flowchart Visualizer Card -->
          <div class="section-card mb-6">
            <div class="card-header-flex">
              <div>
                <h2 class="card-heading">Hierarchical Swarm Architecture Flow</h2>
                <p class="card-desc">Deterministic graph router with 6 specialized sub-agents and closed-loop critic validation.</p>
              </div>
              <span class="tag-status online">Swarm State: Synchronized</span>
            </div>

            <div class="architecture-diagram-container">
              <!-- Level 1: Ingress Channels -->
              <div class="arch-node-level">
                <div class="arch-node ingress-node">
                  <div class="arch-node-header">
                    <span class="arch-node-badge">INGRESS (6 CHANNELS)</span>
                    <span class="arch-node-title">Incoming Customer Message</span>
                  </div>
                  <div class="ingress-channels-pills">
                    <span>WhatsApp</span>
                    <span>Instagram DM</span>
                    <span>IG Comments</span>
                    <span>Messenger</span>
                    <span>FB Comments</span>
                    <span>Telegram</span>
                  </div>
                </div>
              </div>

              <!-- Connector Down -->
              <div class="arch-connector-line">
                <span class="arch-arrow">↓</span>
                <span class="arch-latency-tag">&lt;40ms Intent Classification</span>
              </div>

              <!-- Level 2: Graph Router -->
              <div class="arch-node-level">
                <div class="arch-node router-node">
                  <div class="arch-node-header">
                    <span class="arch-node-badge primary">CENTRAL ORCHESTRATOR</span>
                    <span class="arch-node-title">Graph Router (agent_graph_router.ts)</span>
                  </div>
                  <p class="arch-node-desc">Evaluates intent, complexity tier, entities, and FSM session state to route to the optimal sub-agent.</p>
                </div>
              </div>

              <!-- Connector Down Split -->
              <div class="arch-connector-line">
                <span class="arch-arrow">↓</span>
                <span class="arch-latency-tag">Target Sub-Agent Delegation</span>
              </div>

              <!-- Level 3: 6 Sub-Agents -->
              <div class="arch-subagents-row">
                <div class="arch-mini-card">
                  <span class="mini-num">01</span>
                  <h4>Discovery</h4>
                  <p>pgvector &amp; Vision Search</p>
                </div>
                <div class="arch-mini-card">
                  <span class="mini-num">02</span>
                  <h4>Sales</h4>
                  <p>Cart &amp; Margin Rules</p>
                </div>
                <div class="arch-mini-card">
                  <span class="mini-num">03</span>
                  <h4>Payment</h4>
                  <p>Stripe &amp; COD OTP</p>
                </div>
                <div class="arch-mini-card">
                  <span class="mini-num">04</span>
                  <h4>Logistics</h4>
                  <p>Steadfast Courier API</p>
                </div>
                <div class="arch-mini-card">
                  <span class="mini-num">05</span>
                  <h4>Returns</h4>
                  <p>Exchanges &amp; Damage</p>
                </div>
                <div class="arch-mini-card">
                  <span class="mini-num">06</span>
                  <h4>Support</h4>
                  <p>Human Handoff &amp; FAQ</p>
                </div>
              </div>

              <!-- Connector Down -->
              <div class="arch-connector-line">
                <span class="arch-arrow">↓</span>
                <span class="arch-latency-tag">Closed-Loop Verification</span>
              </div>

              <!-- Level 4: Critic Agent -->
              <div class="arch-node-level">
                <div class="arch-node critic-node">
                  <div class="arch-node-header">
                    <span class="arch-node-badge critic">GUARDRAIL CRITIC</span>
                    <span class="arch-node-title">Closed-Loop Critic Agent (agent_critic.ts)</span>
                  </div>
                  <p class="arch-node-desc">Verifies price accuracy against catalog DB, eliminates hallucinations, and scrubs PII before reply dispatch.</p>
                </div>
              </div>

              <!-- Connector Down -->
              <div class="arch-connector-line">
                <span class="arch-arrow">↓</span>
                <span class="arch-latency-tag">Total Latency &lt;300ms</span>
              </div>

              <!-- Level 5: Validated Reply -->
              <div class="arch-node-level">
                <div class="arch-node output-node">
                  <div class="arch-node-header">
                    <span class="arch-node-badge output">DISPATCHED OUTPUT</span>
                    <span class="arch-node-title">Validated Channel-Formatted Response</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 6 Sub-Agents Detailed Cards -->
          <div class="section-card mb-6">
            <h2 class="card-heading">The 6 Core Functional Sub-Agents</h2>
            <p class="card-desc">Active specialized agents operating within the autonomous commerce swarm.</p>

            <div class="swarms-grid">
              <div class="swarm-card">
                <div class="swarm-badge">SUB-AGENT 01 • DISCOVERY</div>
                <h3 class="swarm-name">Discovery &amp; Visual Agent</h3>
                <p class="swarm-desc">Performs hybrid BM25 + dense vector search (`pgvector`) and analyzes customer-uploaded photos with NVIDIA Vision.</p>
                <div class="swarm-tools">
                  <span>Tools: query_catalog, search_by_image</span>
                </div>
                <div class="swarm-meta">
                  <span>Engine: <strong>Supabase pgvector</strong></span>
                  <span class="tag-status online">Active</span>
                </div>
              </div>

              <div class="swarm-card">
                <div class="swarm-badge">SUB-AGENT 02 • SALES</div>
                <h3 class="swarm-name">Sales &amp; Cart Agent</h3>
                <p class="swarm-desc">Scores buyer purchase intent, resolves variant/size options, validates coupon limits, and builds checkout carts.</p>
                <div class="swarm-tools">
                  <span>Tools: add_to_cart, validate_coupon</span>
                </div>
                <div class="swarm-meta">
                  <span>Engine: <strong>Groq Llama-3.3-70B</strong></span>
                  <span class="tag-status online">Active</span>
                </div>
              </div>

              <div class="swarm-card">
                <div class="swarm-badge">SUB-AGENT 03 • PAYMENT</div>
                <h3 class="swarm-name">Payment &amp; Checkout Agent</h3>
                <p class="swarm-desc">Issues authenticated 1-click Stripe/PayPal payment links, processes TrxID verifications, and sends COD OTP challenges.</p>
                <div class="swarm-tools">
                  <span>Tools: generate_checkout_url, verify_payment</span>
                </div>
                <div class="swarm-meta">
                  <span>Engine: <strong>Payment Gateway API</strong></span>
                  <span class="tag-status online">Active</span>
                </div>
              </div>

              <div class="swarm-card">
                <div class="swarm-badge">SUB-AGENT 04 • LOGISTICS</div>
                <h3 class="swarm-name">Logistics &amp; Courier Agent</h3>
                <p class="swarm-desc">Calculates live delivery estimates with Steadfast/couriers, reserves warehouse inventory, and provides parcel tracking.</p>
                <div class="swarm-tools">
                  <span>Tools: get_delivery_quote, track_consignment</span>
                </div>
                <div class="swarm-meta">
                  <span>Engine: <strong>Steadfast Courier API</strong></span>
                  <span class="tag-status online">Active</span>
                </div>
              </div>

              <div class="swarm-card">
                <div class="swarm-badge">SUB-AGENT 05 • RETURNS</div>
                <h3 class="swarm-name">Returns &amp; Claims Agent</h3>
                <p class="swarm-desc">Evaluates return eligibility policies, collects damaged product images, and processes automated exchange workflows.</p>
                <div class="swarm-tools">
                  <span>Tools: create_return_ticket, check_policy</span>
                </div>
                <div class="swarm-meta">
                  <span>Engine: <strong>Policy Guard Engine</strong></span>
                  <span class="tag-status online">Active</span>
                </div>
              </div>

              <div class="swarm-card">
                <div class="swarm-badge">SUB-AGENT 06 • SUPPORT</div>
                <h3 class="swarm-name">Support &amp; Handoff Agent</h3>
                <p class="swarm-desc">Answers general brand FAQs, resolves order inquiries, and triggers immediate escalation to human staff when requested.</p>
                <div class="swarm-tools">
                  <span>Tools: search_faq, request_human_handoff</span>
                </div>
                <div class="swarm-meta">
                  <span>Engine: <strong>Live Agent Bridge</strong></span>
                  <span class="tag-status online">Active</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Connected Channels Status Grid -->
          <div class="section-card">
            <h2 class="card-heading">Connected Social Commerce Channels (6 Ingress Points)</h2>
            <p class="card-desc">Real-time webhook connectivity status across all integrated Meta and messaging platforms.</p>

            <div class="channels-status-grid">
              <div class="channel-card">
                <div class="channel-card-top">
                  <span class="channel-name font-bold">WhatsApp Business</span>
                  <span class="pulse-dot green"></span>
                </div>
                <span class="channel-route">/api/webhook/whatsapp</span>
                <div class="channel-status-badge">Meta Cloud API • Connected</div>
              </div>

              <div class="channel-card">
                <div class="channel-card-top">
                  <span class="channel-name font-bold">Instagram Direct DM</span>
                  <span class="pulse-dot green"></span>
                </div>
                <span class="channel-route">/api/webhook/instagram</span>
                <div class="channel-status-badge">Meta Graph Webhooks • Connected</div>
              </div>

              <div class="channel-card">
                <div class="channel-card-top">
                  <span class="channel-name font-bold">Instagram Comments</span>
                  <span class="pulse-dot green"></span>
                </div>
                <span class="channel-route">/api/webhook/instagram-comments</span>
                <div class="channel-status-badge">Comment-to-DM Trigger • Connected</div>
              </div>

              <div class="channel-card">
                <div class="channel-card-top">
                  <span class="channel-name font-bold">Facebook Messenger</span>
                  <span class="pulse-dot green"></span>
                </div>
                <span class="channel-route">/api/webhook/messenger</span>
                <div class="channel-status-badge">Page Messaging API • Connected</div>
              </div>

              <div class="channel-card">
                <div class="channel-card-top">
                  <span class="channel-name font-bold">Facebook Comments</span>
                  <span class="pulse-dot green"></span>
                </div>
                <span class="channel-route">/api/webhook/fb-comments</span>
                <div class="channel-status-badge">Post Auto-Reply • Connected</div>
              </div>

              <div class="channel-card">
                <div class="channel-card-top">
                  <span class="channel-name font-bold">Telegram Bot API</span>
                  <span class="pulse-dot green"></span>
                </div>
                <span class="channel-route">/api/webhook/telegram</span>
                <div class="channel-status-badge">Encrypted Bot Webhook • Connected</div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: TOKEN INTELLIGENCE -->
        <div v-if="activeTab === 'tokens'" class="tab-pane">
          <div class="section-card">
            <div class="card-header-flex">
              <div>
                <h2 class="card-heading">Token Usage Intelligence</h2>
                <p class="card-desc">Real-time token telemetry across inference providers.</p>
              </div>
              <div class="timeframe-toggle">
                <button 
                  v-for="tf in ['daily', 'weekly', 'monthly']" 
                  :key="tf" 
                  @click="tokenTimeframe = tf" 
                  class="tf-btn" 
                  :class="{ active: tokenTimeframe === tf }"
                >
                  {{ tf.toUpperCase() }}
                </button>
              </div>
            </div>

            <!-- Token Summary Counters -->
            <div class="token-counters-row">
              <div class="token-counter-box">
                <span class="tc-label">TODAY'S USAGE</span>
                <span class="tc-val">{{ (tokenStats.todayTokens || 0).toLocaleString() }}</span>
                <span class="tc-sub">Tokens processed</span>
              </div>
              <div class="token-counter-box">
                <span class="tc-label">YESTERDAY</span>
                <span class="tc-val">{{ (tokenStats.yesterdayTokens || 0).toLocaleString() }}</span>
                <span class="tc-sub">Tokens processed</span>
              </div>
              <div class="token-counter-box">
                <span class="tc-label">ALL-TIME ACCUMULATED</span>
                <span class="tc-val">{{ (tokenStats.allTimeTokens || 0).toLocaleString() }}</span>
                <span class="tc-sub">Total lifetime tokens</span>
              </div>
            </div>

            <!-- Token Usage by Feature Breakdown -->
            <div class="feature-usage-container mt-6">
              <h3 class="subsection-title">Token Distribution by Swarm Feature</h3>
              <div v-if="tokenStats.featureUsage && tokenStats.featureUsage.length" class="feature-bars-list">
                <div v-for="feat in tokenStats.featureUsage" :key="feat.feature_name" class="feature-bar-row">
                  <div class="fbr-info">
                    <span class="fbr-name">{{ feat.feature_name || 'General Dialogue' }}</span>
                    <span class="fbr-count">{{ (feat.total_tokens || 0).toLocaleString() }} tokens</span>
                  </div>
                  <div class="fbr-progress-track">
                    <div 
                      class="fbr-progress-fill" 
                      :style="{ width: Math.min(100, Math.max(5, ((feat.total_tokens || 0) / (tokenStats.allTimeTokens || 1)) * 100)) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-placeholder">
                <p>No feature-specific token usage data recorded yet.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: KNOWLEDGE GAPS -->
        <div v-if="activeTab === 'gaps'" class="tab-pane">
          <div class="section-card">
            <h2 class="card-heading">RAG Knowledge Gaps &amp; Catalog Missing Queries</h2>
            <p class="card-desc">When customers ask questions that return low semantic match confidence, Clickify Mate records them here for catalog enrichment.</p>

            <div v-if="knowledgeGaps && knowledgeGaps.length" class="gaps-list">
              <div v-for="gap in knowledgeGaps" :key="gap.id || gap.query" class="gap-item-card">
                <div class="gap-item-header">
                  <span class="gap-query-text">"{{ gap.query || gap.missing_topic }}"</span>
                  <span class="gap-freq-badge">Asked {{ gap.frequency || 1 }}x</span>
                </div>
                <div class="gap-item-meta">
                  <span>Channel: <strong>{{ gap.channel || 'WhatsApp Store' }}</strong></span>
                  <span>Recorded: {{ gap.last_asked_at ? new Date(gap.last_asked_at).toLocaleDateString() : 'Recent' }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state-box">
              <div class="empty-icon">✓</div>
              <h3>Zero Knowledge Gaps Detected</h3>
              <p>Your agent swarms are successfully matching 100% of customer catalog queries with high semantic confidence.</p>
            </div>
          </div>
        </div>

        <!-- TAB 5: LEAD INBOX -->
        <div v-if="activeTab === 'inbox'" class="tab-pane">
          <div class="section-card">
            <div class="card-header-flex">
              <div>
                <h2 class="card-heading">Inbound Leads &amp; Partner Inquiries</h2>
                <p class="card-desc">Messages submitted via the public contact forms and enterprise requests.</p>
              </div>
              <div class="leads-header-actions">
                <span class="leads-total-pill">{{ inboxMessages.length }} Messages</span>
              </div>
            </div>

            <div v-if="inboxMessages && inboxMessages.length" class="inbox-table-wrapper">
              <table class="clean-data-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Email</th>
                    <th>Subject / Message</th>
                    <th>Date</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(msg, idx) in inboxMessages" :key="msg.id || idx" class="lead-clickable-row" @click="openLeadModal(msg, idx)">
                    <td class="font-bold">{{ msg.name || 'Anonymous' }}</td>
                    <td><a :href="`mailto:${msg.email}`" class="table-link" @click.stop>{{ msg.email }}</a></td>
                    <td class="msg-preview-cell">{{ msg.message || msg.content || '-' }}</td>
                    <td class="text-muted">{{ msg.created_at ? new Date(msg.created_at).toLocaleDateString() : '-' }}</td>
                    <td class="text-right table-actions-cell" @click.stop>
                      <button @click="openLeadModal(msg, idx)" class="btn-view-icon" title="Read full message">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button @click="deleteLead(msg.id, idx)" class="btn-delete-icon" title="Delete lead">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-state-box">
              <p>No new messages in the inbox server.</p>
            </div>
          </div>
        </div>

        <!-- TAB 6: BLOG & PLAYBOOKS -->
        <div v-if="activeTab === 'blog'" class="tab-pane">
          <!-- AI Blog Auto-Pilot Generator Box -->
          <div class="ai-autopilot-card mb-6">
            <div class="ai-autopilot-header">
              <div class="ai-header-left">
                <div class="ai-badge-row">
                  <span class="ai-sparkle-pill">AI Blog Auto-Pilot</span>
                  <span class="ai-model-tag">DeepSeek / OpenAI / NVIDIA FLUX</span>
                </div>
                <h3 class="ai-autopilot-title">Autonomous SEO Blog Engine</h3>
                <p class="ai-autopilot-sub">Auto-picks high-intent topics, writes human-vibe articles with tables &amp; checklists, validates SEO quality, and publishes directly.</p>
              </div>

              <!-- Auto-Publish ON / OFF Mode Switch -->
              <div class="autopublish-toggle-box">
                <div class="toggle-label-group">
                  <span class="toggle-title">Auto-Publish Mode</span>
                  <span :class="['toggle-status-badge', autoPublishMode ? 'badge-on' : 'badge-off']">
                    {{ autoPublishMode ? 'Direct Publish (ON)' : 'Review First (OFF)' }}
                  </span>
                </div>
                <label class="switch-toggle">
                  <input type="checkbox" v-model="autoPublishMode" />
                  <span class="slider-round"></span>
                </label>
              </div>
            </div>

            <div class="ai-autopilot-inputs mt-4">
              <div class="form-row-3">
                <div class="form-group flex-2">
                  <div class="flex-between">
                    <label class="form-label">Article Topic / Keyword</label>
                    <button type="button" class="btn-auto-pick" @click="autoPickRandomTopic" title="Auto-select a trending topic">
                      Auto-Pick Trending Topic
                    </button>
                  </div>
                  <input v-model="aiBlogPrompt.topic" type="text" placeholder="Click 'Auto-Pick' or enter topic (e.g., WhatsApp Abandoned Cart Recovery in 2026)" class="clean-input" @keyup.enter="generateArticleWithAi" />
                </div>
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select v-model="aiBlogPrompt.category" class="clean-input">
                    <option value="WhatsApp Commerce">WhatsApp Commerce</option>
                    <option value="Instagram Automation">Instagram Automation</option>
                    <option value="AI Swarms">AI Swarms</option>
                    <option value="Growth & Strategy">Growth & Strategy</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Tone Style</label>
                  <select v-model="aiBlogPrompt.tone" class="clean-input">
                    <option value="conversational">Founder (Human Vibe)</option>
                    <option value="technical">Engineering Blueprint</option>
                    <option value="tutorial">Step-by-Step Guide</option>
                  </select>
                </div>
              </div>

              <!-- Author Profile Controls for Auto Engine -->
              <div class="form-row-3 mt-3">
                <div class="form-group">
                  <div class="flex-between">
                    <label class="form-label">Author Name</label>
                    <span v-if="authorProfileSaving" class="author-save-status saving">Saving...</span>
                    <span v-else-if="authorProfileSaved" class="author-save-status saved">Saved to Firebase</span>
                  </div>
                  <input v-model="aiBlogPrompt.author_name" type="text" placeholder="e.g., Marcus Thorne" class="clean-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Author Role / Title</label>
                  <input v-model="aiBlogPrompt.author_role" type="text" placeholder="e.g., Chief AI Architect" class="clean-input" />
                </div>
                <div class="form-group">
                  <div class="flex-between">
                    <label class="form-label">Author Photo</label>
                    <button type="button" class="btn-sync-slug" @click="pickRandomAuthorPhoto" title="Cycle through avatar presets">
                      Preset
                    </button>
                  </div>
                  <div class="author-photo-upload-row">
                    <!-- Hidden file input -->
                    <input
                      ref="authorPhotoFileInput"
                      type="file"
                      accept="image/*"
                      style="display:none"
                      @change="uploadAuthorPhoto"
                    />
                    <!-- Avatar Preview -->
                    <div class="author-avatar-preview-wrap" @click="authorPhotoFileInput?.click()" title="Click to change photo">
                      <img
                        v-if="aiBlogPrompt.author_photo"
                        :src="aiBlogPrompt.author_photo"
                        alt="Author"
                        class="author-avatar-large"
                        @error="onImgError"
                      />
                      <div v-else class="author-avatar-placeholder">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div class="author-avatar-upload-overlay">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                    </div>
                    <!-- Upload Button -->
                    <button type="button" class="btn-upload-photo" @click="authorPhotoFileInput?.click()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Photo
                    </button>
                    <span v-if="aiBlogPrompt.author_photo" class="author-photo-ready-tag">Photo set</span>
                  </div>
                </div>
              </div>

              <!-- Quick Topic Suggestion Pills with Dynamic Shuffle -->
              <div class="topic-suggestions mt-3">
                <div class="flex-between mb-1">
                  <span class="ts-label">Trending Topics (Click to Select):</span>
                  <button type="button" class="btn-sync-slug" @click="refreshTopicSuggestions" title="Shuffle and fetch fresh trending topics">
                    🔄 Shuffle / New Topics
                  </button>
                </div>
                <div class="topic-pills-row">
                  <button type="button" v-for="t in popularTopics" :key="t" :class="['ts-pill', { active: aiBlogPrompt.topic === t }]" @click="aiBlogPrompt.topic = t">
                    {{ t }}
                  </button>
                </div>
              </div>

              <!-- Live Validation Pipeline Tracker -->
              <div v-if="validationStatus" class="validation-pipeline-card mt-4">
                <div class="vpc-header">
                  <span class="vpc-title">AI Publishing &amp; Quality Pipeline</span>
                  <span v-if="validationStatus.score" class="vpc-score">SEO Quality: {{ validationStatus.score }}/100</span>
                </div>
                <div class="vpc-steps">
                  <div :class="['vpc-step', { active: validationStatus.step >= 1, done: validationStatus.step > 1 }]">
                    <span class="step-dot">{{ validationStatus.step > 1 ? '✓' : '1' }}</span>
                    <span>Topic Selection</span>
                  </div>
                  <div :class="['vpc-step', { active: validationStatus.step >= 2, done: validationStatus.step > 2 }]">
                    <span class="step-dot">{{ validationStatus.step > 2 ? '✓' : '2' }}</span>
                    <span>AI Writing &amp; 4K Banner</span>
                  </div>
                  <div :class="['vpc-step', { active: validationStatus.step >= 3, done: validationStatus.step > 3 }]">
                    <span class="step-dot">{{ validationStatus.step > 3 ? '✓' : '3' }}</span>
                    <span>SEO &amp; Formatting Validation</span>
                  </div>
                  <div :class="['vpc-step', { active: validationStatus.step >= 4, done: validationStatus.step >= 4 }]">
                    <span class="step-dot">{{ validationStatus.step >= 4 ? '✓' : '4' }}</span>
                    <span>{{ autoPublishMode ? 'Published Live' : 'Ready in Editor' }}</span>
                  </div>
                </div>
                <p class="vpc-message mt-2">{{ validationStatus.message }}</p>
                <div v-if="lastPublishedSlug" class="mt-2">
                  <a :href="`/blog/${lastPublishedSlug}`" target="_blank" class="btn-view-live-article">
                    <span>View Published Article: /blog/{{ lastPublishedSlug }} &rarr;</span>
                  </a>
                </div>
              </div>

              <div class="ai-autopilot-actions mt-4">
                <button type="button" @click="generateArticleWithAi" class="btn-ai-generate" :disabled="generatingAiBlog">
                  <svg v-if="generatingAiBlog" class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  <span>
                    {{ generatingAiBlog ? 'Processing Pipeline...' : (autoPublishMode ? 'Auto-Generate, Validate & Publish Now' : 'Generate Article Blueprint (Review Mode)') }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Daily Auto-Scheduler Card -->
          <div class="section-card scheduler-card">
            <div class="card-header-flex">
              <div>
                <div class="flex-between" style="justify-content: flex-start; gap: 10px; align-items: center;">
                  <h2 class="card-heading" style="margin-bottom: 0;">Daily Auto-Scheduler</h2>
                  <span v-if="savingSchedule" class="author-save-status saving">Saving...</span>
                  <span v-else-if="scheduleSaved" class="author-save-status saved">Saved to Firebase</span>
                </div>
                <p class="card-desc mt-1">Automatically publish a set number of new AI-generated blogs every day at your chosen time.</p>
              </div>
              <!-- On / Off Toggle -->
              <div class="scheduler-toggle-wrap">
                <span class="scheduler-toggle-label">{{ scheduleConfig.enabled ? 'Scheduler ON' : 'Scheduler OFF' }}</span>
                <button
                  type="button"
                  :class="['scheduler-master-toggle', { active: scheduleConfig.enabled }]"
                  @click="toggleScheduler"
                >
                  <span class="toggle-knob"></span>
                </button>
              </div>
            </div>

            <div class="scheduler-controls mt-4">
              <!-- Blogs per day -->
              <div class="form-group">
                <label class="form-label">Blogs Per Day</label>
                <div class="blogs-per-day-control">
                  <button type="button" class="bpd-btn" @click="scheduleConfig.blogsPerDay = Math.max(1, scheduleConfig.blogsPerDay - 1)">-</button>
                  <span class="bpd-value">{{ scheduleConfig.blogsPerDay }}</span>
                  <button type="button" class="bpd-btn" @click="scheduleConfig.blogsPerDay = Math.min(20, scheduleConfig.blogsPerDay + 1)">+</button>
                  <span class="bpd-unit">blog{{ scheduleConfig.blogsPerDay !== 1 ? 's' : '' }} / day</span>
                </div>
                <!-- Quick preset pills -->
                <div class="bpd-presets mt-2">
                  <button v-for="n in [1,2,3,5,7,10]" :key="n"
                    type="button"
                    :class="['bpd-preset-pill', { active: scheduleConfig.blogsPerDay === n }]"
                    @click="scheduleConfig.blogsPerDay = n"
                  >{{ n }}/day</button>
                </div>
              </div>

              <!-- Run hour -->
              <div class="form-group">
                <label class="form-label">Run Time (UTC)</label>
                <select v-model="scheduleConfig.runHour" class="clean-input">
                  <option v-for="h in 24" :key="h-1" :value="h-1">
                    {{ String(h - 1).padStart(2, '0') }}:00 UTC
                  </option>
                </select>
                <p class="field-hint">Server checks every 30 min — it will run on the next check at or after this hour.</p>
              </div>
            </div>

            <!-- Schedule Status -->
            <div class="scheduler-status-row mt-3" v-if="scheduleConfig.last_run_date">
              <span class="sched-status-dot green"></span>
              <span class="sched-status-text">Last batch: <strong>{{ scheduleConfig.last_run_date }}</strong></span>
            </div>
            <div class="scheduler-status-row mt-2" v-if="scheduleConfig.enabled">
              <span class="sched-status-dot blue"></span>
              <span class="sched-status-text">Next run: today or tomorrow at <strong>{{ String(scheduleConfig.runHour).padStart(2,'0') }}:00 UTC</strong> — generating <strong>{{ scheduleConfig.blogsPerDay }}</strong> blog{{ scheduleConfig.blogsPerDay !== 1 ? 's' : '' }}</span>
            </div>

            <!-- Action Buttons -->
            <div class="scheduler-actions mt-4">
              <button type="button" class="btn-save-schedule" :disabled="savingSchedule" @click="saveSchedule">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                {{ savingSchedule ? 'Saving...' : 'Save Schedule to Firebase' }}
              </button>

              <button type="button" class="btn-run-batch-now" :disabled="runningBatch" @click="runBatchNow">
                <svg v-if="runningBatch" class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                {{ runningBatch ? `Generating ${scheduleConfig.blogsPerDay} blog(s)...` : `Run Batch Now (${scheduleConfig.blogsPerDay} blog${scheduleConfig.blogsPerDay !== 1 ? 's' : ''})` }}
              </button>
            </div>

            <!-- Batch result -->
            <div v-if="batchResult" :class="['scheduler-result mt-3', batchResult.success ? 'success' : 'error']">
              <span v-if="batchResult.success">{{ batchResult.generated }}/{{ scheduleConfig.blogsPerDay }} blog(s) published successfully.</span>
              <span v-else>Batch failed: {{ batchResult.error }}</span>
            </div>
          </div>

          <div class="section-card">
            <div class="card-header-flex">
              <div>
                <h2 class="card-heading">Engineering Playbooks &amp; Articles ({{ blogs.length }})</h2>
                <p class="card-desc">Manage in-depth technical guides, commerce playbooks, and SEO articles.</p>
              </div>
              <div class="blog-header-actions-row">
                <button 
                  v-if="blogs.length > 0"
                  type="button" 
                  class="btn-select-all-pill"
                  @click="toggleSelectAllBlogs"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  <span>{{ isAllBlogsSelected ? 'Deselect All' : 'Select All' }}</span>
                </button>
                <button @click="openCreateBlogModal" class="btn-primary">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Write Manual Article</span>
                </button>
              </div>
            </div>

            <!-- Sticky / Top Bulk Action Bar -->
            <div v-if="selectedBlogSlugs.length > 0" class="bulk-action-bar mt-4">
              <div class="bulk-action-left">
                <span class="bulk-selected-count">{{ selectedBlogSlugs.length }} of {{ blogs.length }} selected</span>
              </div>
              <div class="bulk-action-right">
                <button 
                  type="button" 
                  class="btn-bulk-delete" 
                  :disabled="deletingBatchBlogs" 
                  @click="deleteSelectedBlogs"
                >
                  <svg v-if="deletingBatchBlogs" class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>{{ deletingBatchBlogs ? 'Deleting from Firebase...' : `Delete Selected (${selectedBlogSlugs.length})` }}</span>
                </button>
                <button type="button" class="btn-bulk-cancel" @click="selectedBlogSlugs = []">
                  Deselect
                </button>
              </div>
            </div>

            <!-- Blog Posts List -->
            <div class="blog-manage-grid mt-6">
              <div 
                v-for="(post, idx) in blogs" 
                :key="post.id || idx" 
                :class="['blog-manage-card', { 'is-card-selected': selectedBlogSlugs.includes(post.slug || post.id) }]"
              >
                <!-- Card Select Checkbox -->
                <div class="card-select-checkbox-wrap" @click.stop>
                  <input 
                    type="checkbox" 
                    :checked="selectedBlogSlugs.includes(post.slug || post.id)" 
                    @change="toggleSelectBlog(post.slug || post.id)"
                    class="card-select-checkbox"
                    :id="`chk-${post.slug || idx}`"
                  />
                  <label :for="`chk-${post.slug || idx}`" class="card-select-label"></label>
                </div>

                <div v-if="post.image" class="bmc-image-wrapper">
                  <img :src="post.image" :alt="post.title" class="bmc-cover-img" />
                </div>
                <div class="bmc-header">
                  <span class="bmc-category">{{ post.category || 'COMMERCE' }}</span>
                  <span class="bmc-date">{{ post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Draft' }}</span>
                </div>
                <h3 class="bmc-title">{{ post.title }}</h3>
                <p class="bmc-excerpt">{{ post.excerpt || 'No description provided.' }}</p>
                
                <div class="bmc-author-row" v-if="post.author_name || (post.author && post.author.name)">
                  <img v-if="post.author_photo || (post.author && post.author.avatar)" :src="post.author_photo || post.author.avatar" class="bmc-author-avatar" />
                  <span v-else class="bmc-author-avatar-fallback">{{ (post.author_name || post.author.name).charAt(0) }}</span>
                  <span class="bmc-author-name">{{ post.author_name || post.author.name }}</span>
                </div>

                <div class="bmc-footer">
                  <a :href="`/blog/${post.slug}`" target="_blank" class="bmc-slug">/blog/{{ post.slug }}</a>
                  <div class="bmc-action-btns">
                    <button @click="openEditBlogModal(post, idx)" class="btn-edit-icon" title="Edit article">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button @click="deleteBlog(idx)" class="btn-delete-icon" title="Delete post">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 7: GLOBAL CONFIG -->
        <div v-if="activeTab === 'config'" class="tab-pane">
          <div class="section-card">
            <h2 class="card-heading">Global System Configuration</h2>
            <p class="card-desc">Manage production secrets, API credentials, and platform branding.</p>

            <form @submit.prevent="saveSettings" class="settings-form mt-6">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Platform Name</label>
                  <input v-model="settings.site_name" type="text" class="clean-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">Groq AI API Key (Llama 3.3 / Qwen)</label>
                  <input v-model="settings.groq_api_key" type="password" placeholder="••••••••••••" class="clean-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">NVIDIA NIM API Key (Vision &amp; Reasoning)</label>
                  <input v-model="settings.nvidia_api_key" type="password" placeholder="••••••••••••" class="clean-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">OpenAI (ChatGPT) API Key (GPT-4o)</label>
                  <input v-model="settings.openai_api_key" type="password" placeholder="••••••••••••" class="clean-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">DeepSeek API Key (DeepSeek-V3 / R1)</label>
                  <input v-model="settings.deepseek_api_key" type="password" placeholder="••••••••••••" class="clean-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">Kimi / Moonshot API Key (Long Context)</label>
                  <input v-model="settings.kimi_api_key" type="password" placeholder="••••••••••••" class="clean-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">Google Gemini API Key (Flash / Pro)</label>
                  <input v-model="settings.gemini_api_key" type="password" placeholder="••••••••••••" class="clean-input" />
                </div>
              </div>

              <div class="form-actions mt-6">
                <button type="submit" class="btn-primary" :disabled="savingSettings">
                  <span>{{ savingSettings ? 'Saving Settings...' : 'Save Configuration' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- TAB 8: USER PROBLEM REPORTS & FEEDBACK (FIREBASE FIRESTORE) -->
        <div v-if="activeTab === 'feedback'" class="tab-pane">
          <!-- Summary Metrics Cards -->
          <div class="feedback-stats-grid mb-6">
            <div class="stat-card">
              <div class="stat-icon-wrap bg-violet">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <div class="stat-info">
                <span class="stat-label">Total Reports</span>
                <span class="stat-value">{{ feedbackReports.length }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrap bg-rose">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div class="stat-info">
                <span class="stat-label">Open / Pending</span>
                <span class="stat-value text-rose">{{ openFeedbackCount }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrap bg-amber">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div class="stat-info">
                <span class="stat-label">In Review</span>
                <span class="stat-value">{{ feedbackReports.filter((f: any) => f.status === 'in_review').length }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrap bg-emerald">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div class="stat-info">
                <span class="stat-label">Resolved</span>
                <span class="stat-value text-emerald">{{ feedbackReports.filter((f: any) => f.status === 'resolved').length }}</span>
              </div>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="section-card mb-6">
            <div class="card-header-flex">
              <div>
                <h2 class="card-heading">User Problem Reports &amp; Technical Feedback</h2>
                <p class="card-desc">Real-time issues, bug reports, and suggestions submitted by store owners with screenshots &amp; screen recordings stored in Firebase.</p>
              </div>
              <button @click="fetchFeedbackReports" class="btn-sync-slug" :disabled="loadingFeedback">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" :class="{ 'spin-icon': loadingFeedback }"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                <span>{{ loadingFeedback ? 'Fetching...' : 'Sync Firebase' }}</span>
              </button>
            </div>

            <!-- Search and Filter Bar -->
            <div class="feedback-filter-bar mt-4">
              <div class="ff-search-input-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input v-model="feedbackSearch" type="text" placeholder="Search by subject, email, or issue description..." class="clean-input ff-search" />
              </div>

              <div class="ff-select-group">
                <select v-model="feedbackFilterStatus" class="clean-input ff-select">
                  <option value="all">All Statuses</option>
                  <option value="open">🔴 Open / Pending</option>
                  <option value="in_review">🟡 In Review</option>
                  <option value="resolved">🟢 Resolved</option>
                  <option value="closed">⚪ Closed</option>
                </select>

                <select v-model="feedbackFilterCategory" class="clean-input ff-select">
                  <option value="all">All Categories</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="AI Agent Issue">AI Agent Issue</option>
                  <option value="Payment Gateway Problem">Payment Gateway Problem</option>
                  <option value="Order & Checkout Issue">Order &amp; Checkout Issue</option>
                  <option value="Courier Logistics">Courier Logistics</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
              </div>
            </div>

            <!-- Batch Selection & Action Toolbar -->
            <div class="feedback-batch-toolbar mt-3">
              <div class="fbt-left">
                <label class="fbt-checkbox-wrap">
                  <input 
                    type="checkbox" 
                    :checked="isAllSelected" 
                    @change="toggleSelectAll" 
                    class="fbt-checkbox"
                  />
                  <span>Select All ({{ filteredFeedbackReports.length }})</span>
                </label>
                <span v-if="selectedTicketIds.length > 0" class="fbt-selected-count">
                  {{ selectedTicketIds.length }} selected
                </span>
              </div>

              <div class="fbt-right">
                <button 
                  v-if="selectedTicketIds.length > 0"
                  type="button" 
                  @click="deleteSelectedTickets" 
                  class="btn-danger-sm fbt-delete-btn"
                  :disabled="deletingBatch"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  <span>{{ deletingBatch ? 'Deleting...' : `Delete Selected (${selectedTicketIds.length})` }}</span>
                </button>
                <button 
                  type="button" 
                  @click="fetchFeedbackReports" 
                  class="btn-secondary-sm fbt-refresh-btn"
                  title="Refresh Tickets"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Tickets List inside Scroll Container -->
          <div v-if="loadingFeedback" class="loading-state-card">
            <div class="spin-loader"></div>
            <p>Loading problem reports from Firebase Firestore...</p>
          </div>

          <div v-else-if="filteredFeedbackReports.length > 0" class="feedback-tickets-scroll-container">
            <div class="feedback-tickets-list space-y-4">
              <div 
                v-for="ticket in filteredFeedbackReports" 
                :key="ticket.id"
                class="feedback-ticket-card"
                :class="{ 'is-selected': selectedTicketIds.includes(ticket.id) }"
              >
                <div class="ftc-header">
                  <div class="ftc-user-badge">
                    <label class="ftc-checkbox-label" @click.stop>
                      <input 
                        type="checkbox" 
                        :checked="selectedTicketIds.includes(ticket.id)" 
                        @change="toggleTicketSelection(ticket.id)"
                        class="ftc-checkbox"
                      />
                    </label>
                    <span class="ftc-avatar">{{ (ticket.user_email || 'U').charAt(0).toUpperCase() }}</span>
                    <div>
                      <div class="ftc-email">{{ ticket.user_email || 'Anonymous User' }}</div>
                      <div class="ftc-meta-line">
                        <span class="ftc-category-pill">{{ ticket.category || 'General' }}</span>
                        <span :class="['ftc-priority-pill', (ticket.priority || 'Medium').toLowerCase()]">{{ ticket.priority || 'Medium' }} Priority</span>
                        <span class="ftc-time">{{ ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Recent' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="ftc-status-actions">
                    <select 
                      :value="ticket.status || 'open'" 
                      @change="updateFeedbackStatus(ticket.id, ($event.target as HTMLSelectElement).value)"
                      :class="['ftc-status-select', (ticket.status || 'open')]"
                    >
                      <option value="open">🔴 Open</option>
                      <option value="in_review">🟡 In Review</option>
                      <option value="resolved">🟢 Resolved</option>
                      <option value="closed">⚪ Closed</option>
                    </select>

                    <!-- Single Delete Button -->
                    <button 
                      type="button" 
                      @click="deleteSingleTicket(ticket.id)" 
                      class="ftc-delete-btn"
                      :disabled="deletingTicketId === ticket.id"
                      title="Permanently delete this report"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>

              <!-- Title & Description -->
              <div class="ftc-body">
                <h3 class="ftc-title">{{ ticket.title }}</h3>
                <p class="ftc-desc">{{ ticket.description }}</p>
              </div>

              <!-- Media Attachments (Screenshots & Screen Recording Videos) -->
              <div v-if="ticket.attachments && ticket.attachments.length > 0" class="ftc-attachments-wrap">
                <span class="ftc-att-heading">Attachments ({{ ticket.attachments.length }} files):</span>
                <div class="ftc-att-grid">
                  <div 
                    v-for="(att, aIdx) in ticket.attachments" 
                    :key="aIdx"
                    @click="previewAdminMedia(att)"
                    class="ftc-att-card"
                    :title="getMediaName(att)"
                  >
                    <div class="ftc-att-thumb-wrap">
                      <img v-if="isMediaImage(att)" :src="getMediaUrl(att)" alt="Screenshot" class="ftc-att-img" />
                      <div v-else class="ftc-att-video-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        <span>VIDEO</span>
                      </div>
                    </div>
                    <div class="ftc-att-name">{{ getMediaName(att) }}</div>
                  </div>
                </div>
              </div>

              <!-- Admin Reply Section -->
              <div class="ftc-reply-section">
                <div v-if="ticket.admin_reply" class="ftc-existing-reply">
                  <div class="ftc-reply-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>Current Admin Reply Sent to User:</span>
                  </div>
                  <p class="ftc-reply-text">{{ ticket.admin_reply }}</p>
                </div>

                <!-- Write / Edit Reply Drawer -->
                <div class="ftc-reply-input-row">
                  <textarea 
                    v-model="replyDrafts[ticket.id]" 
                    rows="2" 
                    class="clean-input ftc-reply-textarea" 
                    :placeholder="ticket.admin_reply ? 'Update your reply message to the user...' : 'Write an official reply/resolution to this user...'"
                  ></textarea>
                  <button 
                    type="button" 
                    @click="saveAdminTicketReply(ticket.id)" 
                    class="btn-primary ftc-reply-btn"
                    :disabled="savingReplyId === ticket.id"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    <span>{{ savingReplyId === ticket.id ? 'Sending...' : 'Send Reply' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

          <div v-else class="empty-state-card">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <h3>No Problem Reports Found</h3>
            <p>There are no customer reports matching your search and filter criteria.</p>
          </div>
        </div>
      </section>
    </div>

    <!-- Create Blog Article Modal -->
    <div v-if="showBlogModal" class="modal-backdrop" @click.self="showBlogModal = false">
      <div class="modal-card blog-modal-card">
        <div class="modal-header">
          <h3>{{ editingBlogIdx !== null ? 'Edit Engineering Blueprint / Article' : 'Create Engineering Blueprint / Article' }}</h3>
          <button @click="showBlogModal = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="saveNewBlog" class="modal-form">
          <div class="modal-form-content">
            <div class="form-group">
              <label class="form-label">Article Title <span class="text-req">*</span></label>
              <input v-model="newBlog.title" @input="onBlogTitleChange" type="text" required placeholder="e.g., How to Scale WhatsApp Sales Swarms in 2026" class="clean-input" />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <div class="flex-between">
                  <label class="form-label">URL Slug <span class="text-req">*</span></label>
                  <button type="button" class="btn-sync-slug" @click="regenerateSlug" title="Re-sync and auto-generate slug from title">
                    ⚡ Auto Generate
                  </button>
                </div>
                <div class="slug-input-wrapper">
                  <span class="slug-prefix">/blog/</span>
                  <input v-model="newBlog.slug" @input="onSlugManualInput" type="text" required placeholder="how-to-scale-whatsapp-sales" class="clean-input slug-input-field" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <select v-model="newBlog.category" class="clean-input">
                  <option value="WhatsApp Commerce">WhatsApp Commerce</option>
                  <option value="Instagram Automation">Instagram Automation</option>
                  <option value="AI Swarms">AI Swarms</option>
                  <option value="Growth & Strategy">Growth & Strategy</option>
                </select>
              </div>
            </div>

            <!-- Author Info Section -->
            <div class="form-section-sub">
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Author Name <span class="text-opt">(Optional)</span></label>
                  <input v-model="newBlog.author_name" type="text" placeholder="e.g., Marcus Thorne" class="clean-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Author Role <span class="text-opt">(Optional)</span></label>
                  <input v-model="newBlog.author_role" type="text" placeholder="e.g., Chief AI Architect" class="clean-input" />
                </div>
              </div>
              <div class="form-group mt-2">
                <label class="form-label">Author Photo URL <span class="text-opt">(Optional)</span></label>
                <input v-model="newBlog.author_photo" type="url" placeholder="https://images.unsplash.com/photo-... or image link" class="clean-input" />
              </div>
            </div>

            <!-- Blog Cover Image Section -->
            <div class="form-group">
              <div class="flex-between">
                <label class="form-label">Blog Cover Image URL <span class="text-opt">(Optional)</span></label>
                <div class="img-action-buttons">
                  <button type="button" class="btn-sync-slug" @click="generateFreeAiCoverImage" title="Generate tailored AI cover image">
                    🎨 AI FLUX Cover
                  </button>
                  <button type="button" class="btn-sync-slug" @click="generateUnsplashCoverImage" title="Pick matching real studio photography">
                    📸 Real Photo
                  </button>
                </div>
              </div>
              <input v-model="newBlog.image" type="url" placeholder="https://images.unsplash.com/... or AI image URL" class="clean-input" />
              
              <!-- Quick Visual Theme Presets -->
              <div class="image-style-presets mt-2">
                <span class="ts-label">Visual Style:</span>
                <button type="button" class="ts-pill" @click="setCoverStyle('whatsapp')">📱 WhatsApp UI</button>
                <button type="button" class="ts-pill" @click="setCoverStyle('instagram')">💬 Instagram DM</button>
                <button type="button" class="ts-pill" @click="setCoverStyle('swarms')">🤖 Multi-Agent Flow</button>
                <button type="button" class="ts-pill" @click="setCoverStyle('ecommerce')">🛍️ Storefront Checkout</button>
                <button type="button" class="ts-pill" @click="setCoverStyle('analytics')">📊 Growth Analytics</button>
              </div>

              <div v-if="newBlog.image" class="image-live-preview">
                <img :src="newBlog.image" alt="Cover Preview" class="cover-preview-img" @error="onImgError" />
              </div>
            </div>

            <div class="form-group">
              <div class="flex-between">
                <label class="form-label">Short Excerpt / SEO Meta Description</label>
                <span class="text-hint">{{ (newBlog.excerpt || '').length }}/160 chars</span>
              </div>
              <textarea v-model="newBlog.excerpt" rows="2" maxlength="200" class="clean-input" placeholder="Brief summary used as Google search snippet and blog preview card..."></textarea>
            </div>

            <!-- Google Search SEO Snippet Card -->
            <div class="seo-google-card">
              <div class="sgc-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span>Google Search Result Preview</span>
                <span class="sgc-badge">SEO Active</span>
              </div>
              <div class="sgc-body">
                <div class="sgc-url">https://clickifymate.com &rsaquo; blog &rsaquo; {{ newBlog.slug || 'how-to-scale-whatsapp-sales' }}</div>
                <div class="sgc-title">{{ newBlog.title || 'Your Article Title — Clickify Mate' }}</div>
                <div class="sgc-desc">{{ newBlog.excerpt || 'Write a compelling excerpt above to optimize your click-through rate in Google search results.' }}</div>
              </div>
            </div>

            <!-- Article Content with Markdown Toolbar -->
            <div class="form-group">
              <div class="content-toolbar-header">
                <label class="form-label">Article Content (Markdown)</label>
                <div class="editor-tabs">
                  <button type="button" :class="['ed-tab-btn', { active: blogEditorMode === 'write' }]" @click="blogEditorMode = 'write'">Write</button>
                  <button type="button" :class="['ed-tab-btn', { active: blogEditorMode === 'preview' }]" @click="blogEditorMode = 'preview'">Preview</button>
                </div>
              </div>

              <!-- Quick Formatting Toolbar Buttons -->
              <div v-if="blogEditorMode === 'write'" class="md-toolbar">
                <button type="button" class="md-btn" @click="insertMarkdown('## ')" title="Heading 2">H2</button>
                <button type="button" class="md-btn" @click="insertMarkdown('### ')" title="Heading 3">H3</button>
                <button type="button" class="md-btn font-bold" @click="insertMarkdown('**bold**')" title="Bold">B</button>
                <button type="button" class="md-btn italic" @click="insertMarkdown('*italic*')" title="Italic">I</button>
                <button type="button" class="md-btn" @click="insertMarkdown('~~strikethrough~~')" title="Strikethrough"><s>S</s></button>
                <button type="button" class="md-btn" @click="insertMarkdown('- Item 1\n- Item 2')" title="Bullet List">• List</button>
                <button type="button" class="md-btn" @click="insertMarkdown('1. Step One\n2. Step Two')" title="Numbered List">1. List</button>
                <button type="button" class="md-btn" @click="insertMarkdown('- [x] Completed task\n- [ ] Pending task')" title="Checklist / Tasks">☑ Task</button>
                <button type="button" class="md-btn" @click="insertMarkdown('> Quote or excerpt here.')" title="Blockquote">” Quote</button>
                <button type="button" class="md-btn alert-btn-tip" @click="insertMarkdown('> [!TIP]\n> **Pro Tip**: Automating DMs can increase conversions by 340%.')" title="Pro Tip Box">Tip Box</button>
                <button type="button" class="md-btn alert-btn-warn" @click="insertMarkdown('> [!WARNING]\n> **Warning**: Never expose private API keys in client-side code.')" title="Warning Box">Warn Box</button>
                <button type="button" class="md-btn table-btn" @click="insertMarkdown('| Feature | Starter | Enterprise |\n|---|---|---|\n| Response Time | 1.2s | < 300ms |\n| AI Swarm Concurrency | 5 chats | Unlimited |')" title="Comparison Table">Table</button>
                <button type="button" class="md-btn" @click="insertMarkdown('---')" title="Divider Line">― Divider</button>
                <button type="button" class="md-btn font-mono" @click="insertMarkdown('`api_token`')" title="Inline Code">&lt;/&gt;</button>
                <button type="button" class="md-btn" @click="insertMarkdown('[Clickify Mate](https://clickifymate.com)')" title="Insert Link">Link</button>
                <button type="button" class="md-btn" @click="insertMarkdown('https://www.youtube.com/watch?v=dQw4w9WgXcQ')" title="Embed YouTube or Loom Video">Video</button>
                <span class="md-stats-pill">~{{ readTimeMin }} min read ({{ wordCount }} words)</span>
              </div>

              <!-- Write Mode -->
              <textarea 
                v-if="blogEditorMode === 'write'" 
                ref="blogContentInput"
                v-model="newBlog.content" 
                rows="14" 
                class="clean-input font-mono article-markdown-editor" 
                placeholder="Write full article in Markdown...&#10;&#10;### Section Heading&#10;Write detailed paragraphs here.&#10;&#10;- Key takeaway item 1&#10;- Key takeaway item 2&#10;&#10;| Feature | Free | Pro |&#10;|---|---|---|&#10;| Speed | 1s | 300ms |"
              ></textarea>

              <!-- Live Preview Mode -->
              <div v-else class="md-preview-pane">
                <div v-if="!newBlog.content" class="text-muted p-4 text-center">No content typed yet. Switch back to Write mode.</div>
                <div v-else class="article-preview-content" v-html="renderMarkdownToHtml(newBlog.content)"></div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showBlogModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">{{ editingBlogIdx !== null ? 'Update & Save Changes' : 'Save & Publish' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Lead Message Details Modal -->
    <div v-if="showLeadModal && selectedLead" class="modal-backdrop" @click.self="showLeadModal = false">
      <div class="modal-card lead-modal-card">
        <div class="modal-header">
          <div class="lead-modal-user-info">
            <span class="lead-avatar-bubble">{{ (selectedLead.name || 'U').charAt(0).toUpperCase() }}</span>
            <div>
              <h3 class="lead-modal-title">{{ selectedLead.name || 'Anonymous' }}</h3>
              <a :href="`mailto:${selectedLead.email}`" class="lead-modal-email">{{ selectedLead.email }}</a>
            </div>
          </div>
          <button @click="showLeadModal = false" class="modal-close-btn">&times;</button>
        </div>

        <div class="lead-modal-body-scroll">
          <div class="lead-modal-meta-grid">
            <div class="lmm-item" v-if="selectedLead.platform">
              <span class="lmm-label">Store Platform</span>
              <span class="lmm-val tag-platform">{{ selectedLead.platform }}</span>
            </div>
            <div class="lmm-item" v-if="selectedLead.volume">
              <span class="lmm-label">Monthly DM Volume</span>
              <span class="lmm-val tag-volume">{{ selectedLead.volume }}</span>
            </div>
            <div class="lmm-item">
              <span class="lmm-label">Submitted Date</span>
              <span class="lmm-val">{{ selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString() : 'Recent' }}</span>
            </div>
          </div>

          <div class="lead-modal-body">
            <label class="form-label">Full Message Content</label>
            <div class="lead-full-message-box">
              <p>{{ selectedLead.message || selectedLead.content || 'No message text provided.' }}</p>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="deleteCurrentLead" class="btn-delete-lead">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete Inquiry</span>
          </button>
          <a :href="`mailto:${selectedLead.email}?subject=Clickify Mate Inquiry Followup`" class="btn-primary" style="text-decoration: none;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Reply via Email</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Admin Media Attachment Lightbox / Video Player Modal -->
    <div v-if="selectedFeedbackMedia" class="modal-backdrop" @click.self="selectedFeedbackMedia = null">
      <div class="modal-card" style="max-width: 800px; padding: 20px;">
        <div class="modal-header" style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(123, 76, 133, 0.16);">
          <h3 style="font-size: 15px; font-weight: 700; color: #341F37; margin: 0;">{{ getMediaName(selectedFeedbackMedia) }}</h3>
          <button @click="selectedFeedbackMedia = null" class="modal-close-btn">&times;</button>
        </div>
        <div style="background: #000; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 320px;">
          <img 
            v-if="isMediaImage(selectedFeedbackMedia)" 
            :src="getMediaUrl(selectedFeedbackMedia)" 
            alt="Screenshot" 
            style="max-width: 100%; max-height: 70vh; object-fit: contain;" 
          />
          <video 
            v-else 
            :src="getMediaUrl(selectedFeedbackMedia)" 
            controls 
            autoplay 
            style="max-width: 100%; max-height: 70vh;"
          ></video>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'

definePageMeta({
  layout: 'admin'
})

const activeTab = ref<'overview' | 'agents' | 'tokens' | 'gaps' | 'inbox' | 'blog' | 'config' | 'feedback'>('overview')
const loading = ref(false)
const savingSettings = ref(false)

// User Problem Reports & Feedback State (Firebase Firestore)
const feedbackReports = ref<any[]>([])
const loadingFeedback = ref(false)
const feedbackSearch = ref('')
const feedbackFilterStatus = ref('all')
const feedbackFilterCategory = ref('all')
const selectedFeedbackMedia = ref<any>(null)
const replyDrafts = reactive<Record<string, string>>({})
const savingReplyId = ref<string | null>(null)

const tokenStats = reactive<any>({
  todayTokens: 0,
  yesterdayTokens: 0,
  allTimeTokens: 0,
  featureUsage: []
})

const analyticsTimeframe = ref<'7d' | '30d' | '90d' | '1y' | '2y' | 'custom'>('7d')
const showCustomDatePanel = ref(false)

const customDateRange = reactive({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  end: new Date().toISOString().slice(0, 10)
})

const conversationAnalytics = reactive({
  timeframe: '7d',
  isYearly: false,
  isCustom: false,
  customStart: '',
  customEnd: '',
  totalConversations: 128,
  todayConversations: 24,
  totalInbound: 342,
  totalReplies: 389,
  todayInbound: 48,
  todayReplies: 52,
  autonomousResolutionRate: 95.8,
  avgLatencyMs: 320,
  activeChannelsCount: 4,
  channels: [
    { id: 'whatsapp', name: 'WhatsApp Business API', color: '#25D366', messages: 412, conversations: 74, share: 56, status: 'Active (Tier-1 BSP)' },
    { id: 'instagram', name: 'Instagram DM & Comments', color: '#E1306C', messages: 186, conversations: 32, share: 25, status: 'Active (Meta Graph API)' },
    { id: 'telegram', name: 'Telegram Bot Commerce', color: '#229ED9', messages: 89, conversations: 16, share: 12, status: 'Active (Webhook Poller)' },
    { id: 'facebook', name: 'Facebook Messenger & FB Comments', color: '#1877F2', messages: 44, conversations: 8, share: 7, status: 'Active (Page Webhook)' }
  ],
  activityList: [
    { periodKey: '2026-08-30', displayLabel: 'Today', inbound: 48, replies: 52, conversations: 24, resolutionRate: '96.4%', isMonthly: false },
    { periodKey: '2026-08-29', displayLabel: 'Yesterday', inbound: 54, replies: 61, conversations: 28, resolutionRate: '95.1%', isMonthly: false },
    { periodKey: '2026-08-28', displayLabel: 'Aug 28', inbound: 42, replies: 49, conversations: 19, resolutionRate: '97.2%', isMonthly: false },
    { periodKey: '2026-08-27', displayLabel: 'Aug 27', inbound: 67, replies: 73, conversations: 33, resolutionRate: '94.8%', isMonthly: false },
    { periodKey: '2026-08-26', displayLabel: 'Aug 26', inbound: 51, replies: 58, conversations: 22, resolutionRate: '95.6%', isMonthly: false },
    { periodKey: '2026-08-25', displayLabel: 'Aug 25', inbound: 39, replies: 44, conversations: 18, resolutionRate: '96.0%', isMonthly: false },
    { periodKey: '2026-08-24', displayLabel: 'Aug 24', inbound: 41, replies: 47, conversations: 20, resolutionRate: '96.8%', isMonthly: false }
  ],
  totalOrdersHandled: 42
})

const toggleCustomDatePanel = () => {
  showCustomDatePanel.value = !showCustomDatePanel.value
  if (showCustomDatePanel.value) {
    analyticsTimeframe.value = 'custom'
  }
}

const changeAnalyticsTimeframe = async (tf: any) => {
  analyticsTimeframe.value = tf
  if (tf !== 'custom') {
    showCustomDatePanel.value = false
  }
  try {
    const res: any = await $fetch(`/api/admin/conversation-analytics?timeframe=${tf}`)
    if (res?.success && res.analytics) {
      Object.assign(conversationAnalytics, res.analytics)
    }
  } catch (err) {
    console.error('Failed to change analytics timeframe:', err)
  }
}

const applyCustomDateRange = async () => {
  if (!customDateRange.start || !customDateRange.end) return
  analyticsTimeframe.value = 'custom'
  try {
    const res: any = await $fetch(`/api/admin/conversation-analytics?timeframe=custom&startDate=${customDateRange.start}&endDate=${customDateRange.end}`)
    if (res?.success && res.analytics) {
      Object.assign(conversationAnalytics, res.analytics)
    }
  } catch (err) {
    console.error('Failed to apply custom date range:', err)
  }
}

const setCustomPreset = (preset: 'this_month' | 'last_month' | 'last_6_months' | 'ytd' | 'year_2025') => {
  const now = new Date()
  if (preset === 'this_month') {
    customDateRange.start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    customDateRange.end = now.toISOString().slice(0, 10)
  } else if (preset === 'last_month') {
    customDateRange.start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    customDateRange.end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
  } else if (preset === 'last_6_months') {
    customDateRange.start = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().slice(0, 10)
    customDateRange.end = now.toISOString().slice(0, 10)
  } else if (preset === 'ytd') {
    customDateRange.start = `${now.getFullYear()}-01-01`
    customDateRange.end = now.toISOString().slice(0, 10)
  } else if (preset === 'year_2025') {
    customDateRange.start = '2025-01-01'
    customDateRange.end = '2025-12-31'
  }
  applyCustomDateRange()
}

const tokenTimeframe = ref('daily')
const knowledgeGaps = ref<any[]>([])
const inboxMessages = ref<any[]>([])
const blogs = ref<any[]>([])
const settings = reactive<any>({
  site_name: 'Clickify Mate',
  groq_api_key: '',
  nvidia_api_key: '',
  openai_api_key: '',
  deepseek_api_key: '',
  kimi_api_key: '',
  gemini_api_key: ''
})

const selectedLead = ref<any>(null)
const selectedLeadIdx = ref<number>(-1)
const showLeadModal = ref(false)

const openLeadModal = (msg: any, idx: number) => {
  selectedLead.value = msg
  selectedLeadIdx.value = idx
  showLeadModal.value = true
}

const deleteCurrentLead = async () => {
  if (selectedLead.value) {
    await deleteLead(selectedLead.value.id, selectedLeadIdx.value)
    showLeadModal.value = false
  }
}

const showBlogModal = ref(false)
const editingBlogIdx = ref<number | null>(null)
const newBlog = reactive({
  title: '',
  slug: '',
  category: 'WhatsApp Commerce',
  author_name: '',
  author_role: '',
  author_photo: '',
  image: '',
  excerpt: '',
  content: ''
})

const blogEditorMode = ref<'write' | 'preview'>('write')
const blogContentInput = ref<HTMLTextAreaElement | null>(null)

const wordCount = computed(() => {
  const text = newBlog.content || ''
  return text.trim() ? text.trim().split(/\s+/).length : 0
})

const readTimeMin = computed(() => {
  return Math.max(1, Math.ceil(wordCount.value / 200))
})

const insertMarkdown = (syntax: string) => {
  if (!newBlog.content) {
    newBlog.content = syntax
  } else {
    newBlog.content += `\n\n${syntax}`
  }
}

const isSlugManuallyEdited = ref(false)

const slugify = (text: string) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const onBlogTitleChange = () => {
  if (!isSlugManuallyEdited.value) {
    newBlog.slug = slugify(newBlog.title)
  }
}

const regenerateSlug = () => {
  newBlog.slug = slugify(newBlog.title)
  isSlugManuallyEdited.value = false
}

const onSlugManualInput = () => {
  isSlugManuallyEdited.value = true
}

const onImgError = (e: any) => {
  if (e && e.target) e.target.style.display = 'none'
}

const autoPublishMode = ref(true)
const validationStatus = ref<{ step: number; message: string; success?: boolean; score?: number } | null>(null)
const lastPublishedSlug = ref('')

// ─── Daily Auto-Scheduler ────────────────────────────────────────────────────
const SCHEDULE_STORAGE_KEY = 'clickify_blog_schedule'

const scheduleConfig = reactive({
  enabled: false,
  blogsPerDay: 1,
  runHour: 9,
  last_run_date: ''
})

const savingSchedule = ref(false)
const scheduleSaved  = ref(false)
const runningBatch   = ref(false)
const batchResult    = ref<{ success: boolean; generated?: number; error?: string } | null>(null)

// Save to localStorage immediately
const cacheScheduleLocal = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({
      enabled: scheduleConfig.enabled,
      blogsPerDay: scheduleConfig.blogsPerDay,
      runHour: scheduleConfig.runHour,
      last_run_date: scheduleConfig.last_run_date
    }))
  } catch { /* ignore */ }
}

const saveSchedule = async (showPrompt: boolean | Event = true) => {
  const isUserClick = typeof showPrompt === 'boolean' ? showPrompt : true
  savingSchedule.value = true
  scheduleSaved.value  = false
  cacheScheduleLocal()
  try {
    const res: any = await $fetch('/api/admin/blog-schedule', {
      method: 'POST',
      body: {
        enabled: scheduleConfig.enabled,
        blogsPerDay: Number(scheduleConfig.blogsPerDay),
        runHour: Number(scheduleConfig.runHour)
      }
    })
    if (res?.success) {
      scheduleSaved.value = true
      setTimeout(() => { scheduleSaved.value = false }, 3000)
    }
  } catch (err: any) {
    console.error('Failed to save schedule to Firebase:', err)
    if (isUserClick) {
      alert('Failed to save schedule to Firebase: ' + (err?.message || 'Server error'))
    }
  } finally {
    savingSchedule.value = false
  }
}

// Immediate save on toggle switch click
const toggleScheduler = async () => {
  scheduleConfig.enabled = !scheduleConfig.enabled
  cacheScheduleLocal()
  await saveSchedule(false)
}

// Debounced auto-save on value change
let scheduleSaveDebounceTimer: ReturnType<typeof setTimeout> | null = null
const debounceSaveSchedule = () => {
  cacheScheduleLocal()
  if (scheduleSaveDebounceTimer) clearTimeout(scheduleSaveDebounceTimer)
  scheduleSaveDebounceTimer = setTimeout(() => {
    saveSchedule(false)
  }, 1200)
}

watch(() => scheduleConfig.blogsPerDay, () => debounceSaveSchedule())
watch(() => scheduleConfig.runHour, () => debounceSaveSchedule())

const runBatchNow = async () => {
  runningBatch.value = true
  batchResult.value  = null
  try {
    const res: any = await $fetch('/api/admin/blog-generate-batch', {
      method: 'POST',
      body: { count: scheduleConfig.blogsPerDay, category: aiBlogPrompt.category }
    })
    batchResult.value = { success: true, generated: res.generated }
    // Refresh blog list
    await refreshAllData()
  } catch (err: any) {
    batchResult.value = { success: false, error: err?.message || 'Batch failed' }
  } finally {
    runningBatch.value = false
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const authorAvatarPresets = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
]

let avatarIndex = 0

const pickRandomAuthorPhoto = () => {
  avatarIndex = (avatarIndex + 1) % authorAvatarPresets.length
  aiBlogPrompt.author_photo = authorAvatarPresets[avatarIndex] || ''
  // Save immediately — don't wait for watch flush
  saveAuthorPhoto(aiBlogPrompt.author_photo)
}

// File input ref for author photo upload
const authorPhotoFileInput = ref<HTMLInputElement | null>(null)

/**
 * Compress image to a small JPEG thumbnail using canvas.
 * Output is ~10–25 KB as base64 (well within Firestore's 1MB field limit).
 */
const compressImageToThumbnail = (dataUrl: string, maxPx = 150, quality = 0.72): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl) // fallback: use original
    img.src = dataUrl
  })
}

const uploadAuthorPhoto = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (JPG, PNG, WebP, etc.)')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be under 5MB')
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    const raw = e.target?.result
    if (typeof raw !== 'string') return

    // Compress to thumbnail — keeps Firestore payload < 30KB
    const compressed = await compressImageToThumbnail(raw)
    aiBlogPrompt.author_photo = compressed
    // Save directly — don't rely on async watch flush
    saveAuthorPhoto(compressed)
  }
  reader.readAsDataURL(file)

  // Reset input so same file can be re-selected
  input.value = ''
}

const allTrendingTopicsPool = [
  'WhatsApp Abandoned Cart Recovery in 2026',
  'Multi-Agent Swarms vs Traditional Chatbots',
  'Automating Instagram DM Sales for Shopify Stores',
  'Reducing AI Response Latency to Under 300ms',
  'How to Connect WhatsApp Cloud API with WooCommerce',
  'Building an Autonomous Social Commerce Sales Swarm',
  'bKash and Nagad Automated Payment Verification with AI',
  'Steadfast Courier API Integration for Automated Dispatch',
  'Omnichannel Commerce: Unifying Messenger, Instagram, and WhatsApp',
  'Building High-Converting Product Carousels in WhatsApp Chat',
  'Automated Defect & Complaint Resolution Using Multimodal AI',
  'Boosting Repeat Orders with Automated Post-Purchase Sequences',
  'How to Prevent WhatsApp Account Bans on Cloud API',
  'Meta Conversion API (CAPI) Integration for WhatsApp Ad Campaigns',
  'Real-Time Stock Deduction During Social Chat Checkouts',
  'Autonomous Price Negotiation Rules for AI Sales Agents',
  'Scaling D2C Brand Support from 1,000 to 100,000 Daily Messages',
  'AI-Powered Live Delivery Notifications and Customer Updates',
  'How to Train Llama-3.3 on Your Custom Store Product Catalog',
  'Automated Facebook Page Comment to Messenger Sales Conversion',
  'Reducing Return-to-Origin (RTO) Rates with Automated Order Confirmation'
]

const popularTopics = ref<string[]>([
  'WhatsApp Abandoned Cart Recovery in 2026',
  'Multi-Agent Swarms vs Traditional Chatbots',
  'Automating Instagram DM Sales for Shopify Stores',
  'Reducing AI Response Latency to Under 300ms',
  'How to Connect WhatsApp Cloud API with WooCommerce',
  'Building an Autonomous Social Commerce Sales Swarm'
])

const refreshTopicSuggestions = () => {
  const shuffled = [...allTrendingTopicsPool].sort(() => 0.5 - Math.random())
  popularTopics.value = shuffled.slice(0, 6)
}

const autoPickRandomTopic = () => {
  const unused = allTrendingTopicsPool.filter(t => !blogs.value.some((b: any) => (b.title || '').toLowerCase().includes(t.toLowerCase().slice(0, 15))))
  const poolToUse = unused.length > 0 ? unused : allTrendingTopicsPool
  const picked = poolToUse[Math.floor(Math.random() * poolToUse.length)]
  aiBlogPrompt.topic = picked || ''
}

const aiBlogPrompt = reactive({
  topic: '',
  category: 'WhatsApp Commerce',
  tone: 'conversational',
  author_name: 'Marcus Thorne',
  author_role: 'Chief AI Architect',
  author_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
})

// ─── Auto-save & restore author profile (Firebase + localStorage cache) ──────
const AUTHOR_TEXT_KEY  = 'clickify_author_text'
const AUTHOR_PHOTO_KEY = 'clickify_author_photo'
const AUTHOR_STORAGE_KEY = 'clickify_admin_author_profile' // legacy key

const authorProfileSaving = ref(false)
const authorProfileSaved  = ref(false)

// 1. Save text to localStorage instantly (tiny payload, always fast)
const saveAuthorText = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(AUTHOR_TEXT_KEY, JSON.stringify({
      author_name: aiBlogPrompt.author_name,
      author_role: aiBlogPrompt.author_role
    }))
  } catch { /* ignore */ }
}

// 2. Save photo to its own localStorage key (base64-safe, no quota collision)
const saveAuthorPhoto = (photo: string) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(AUTHOR_PHOTO_KEY, photo)
  } catch {
    try {
      localStorage.removeItem(AUTHOR_PHOTO_KEY)
      localStorage.setItem(AUTHOR_PHOTO_KEY, photo)
    } catch { /* still too large */ }
  }
}

// 3. Debounced Firebase save — waits 1.5 s after last change before writing
let firebaseSaveTimer: ReturnType<typeof setTimeout> | null = null

const persistAuthorProfileToFirebase = () => {
  if (firebaseSaveTimer) clearTimeout(firebaseSaveTimer)
  firebaseSaveTimer = setTimeout(async () => {
    authorProfileSaving.value = true
    authorProfileSaved.value  = false
    try {
      await $fetch('/api/admin/author-profile', {
        method: 'POST',
        body: {
          author_name: aiBlogPrompt.author_name,
          author_role: aiBlogPrompt.author_role,
          author_photo: aiBlogPrompt.author_photo
        }
      })
      authorProfileSaved.value = true
      // Auto-clear the "Saved" indicator after 2 s
      setTimeout(() => { authorProfileSaved.value = false }, 2000)
    } catch (err) {
      console.warn('[Author Profile] Firebase save failed:', err)
    } finally {
      authorProfileSaving.value = false
    }
  }, 1500)
}

// Watches — save to localStorage immediately + debounce Firebase
watch(() => aiBlogPrompt.author_name, () => { saveAuthorText(); persistAuthorProfileToFirebase() })
watch(() => aiBlogPrompt.author_role,  () => { saveAuthorText(); persistAuthorProfileToFirebase() })
watch(() => aiBlogPrompt.author_photo, (val) => { saveAuthorPhoto(val); persistAuthorProfileToFirebase() })
// ─────────────────────────────────────────────────────────────────────────────

const generatingAiBlog = ref(false)

const generateArticleWithAi = async () => {
  if (!aiBlogPrompt.topic) {
    autoPickRandomTopic()
  }

  generatingAiBlog.value = true
  lastPublishedSlug.value = ''
  validationStatus.value = {
    step: 1,
    message: `[1/4] Selected target topic: "${aiBlogPrompt.topic}"...`
  }

  try {
    validationStatus.value = {
      step: 2,
      message: '[2/4] Drafting high-ranking human-vibe article and generating 4K FLUX AI cover banner...'
    }

    const res: any = await $fetch('/api/admin/blog-auto-generate', {
      method: 'POST',
      body: {
        topic: aiBlogPrompt.topic,
        category: aiBlogPrompt.category,
        tone: aiBlogPrompt.tone
      }
    })

    if (!res || !res.success || !res.data) {
      throw new Error(res?.error || 'AI generation failed')
    }

    const articleData = res.data

    // Step 3: Automated Quality & SEO Validation Engine
    validationStatus.value = {
      step: 3,
      message: '[3/4] Running automated SEO structure, readability, and formatting validation...'
    }

    let seoScore = 95
    if (articleData.title && articleData.title.length >= 40 && articleData.title.length <= 75) seoScore += 2
    if (articleData.excerpt && articleData.excerpt.length >= 100) seoScore += 2
    if (articleData.content && articleData.content.includes('|') && articleData.content.includes('##')) seoScore += 1

    // Ensure clean slug
    const cleanSlug = (articleData.slug || slugify(articleData.title)).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check duplicate slug
    let finalSlug = cleanSlug
    if (blogs.value.some((b: any) => b.slug === finalSlug)) {
      finalSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`
    }

    const finalAuthorName = aiBlogPrompt.author_name?.trim() || articleData.author_name || 'Engineering Team'
    const finalAuthorRole = aiBlogPrompt.author_role?.trim() || articleData.author_role || 'Commerce AI Specialist'
    const finalAuthorPhoto = aiBlogPrompt.author_photo?.trim() || articleData.author_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'

    const validatedPost = {
      title: articleData.title,
      slug: finalSlug,
      category: articleData.category || aiBlogPrompt.category,
      author_name: finalAuthorName,
      author_role: finalAuthorRole,
      author_photo: finalAuthorPhoto,
      author: {
        name: finalAuthorName,
        role: finalAuthorRole,
        avatar: finalAuthorPhoto
      },
      image: articleData.image || `https://image.pollinations.ai/prompt/${encodeURIComponent(articleData.title)}?width=1200&height=630&model=flux&nologo=true`,
      excerpt: articleData.excerpt || '',
      content: articleData.content || '',
      created_at: new Date().toISOString()
    }

    // Step 4: Publish or Review
    if (autoPublishMode.value) {
      validationStatus.value = {
        step: 4,
        message: `[4/4] Validation passed (SEO Score: ${seoScore}/100). Publishing directly to database and live blog...`,
        score: seoScore
      }

      blogs.value.unshift(validatedPost)

      await $fetch('/api/admin/manage?action=save_all', {
        method: 'POST',
        body: {
          collection: 'blog',
          data: blogs.value
        }
      })

      lastPublishedSlug.value = validatedPost.slug
      validationStatus.value = {
        step: 4,
        message: `🎉 Successfully published live to /blog/${validatedPost.slug}! SEO Score: ${seoScore}/100.`,
        success: true,
        score: seoScore
      }
    } else {
      // Review Mode: Load into editor modal
      newBlog.title = validatedPost.title
      newBlog.slug = validatedPost.slug
      newBlog.category = validatedPost.category
      newBlog.author_name = validatedPost.author_name
      newBlog.author_role = validatedPost.author_role
      newBlog.author_photo = validatedPost.author_photo
      newBlog.image = validatedPost.image
      newBlog.excerpt = validatedPost.excerpt
      newBlog.content = validatedPost.content
      isSlugManuallyEdited.value = true
      blogEditorMode.value = 'write'
      showBlogModal.value = true

      validationStatus.value = {
        step: 4,
        message: `✓ Blueprint validated (SEO Score: ${seoScore}/100). Opened in editor for review.`,
        success: true,
        score: seoScore
      }
    }
  } catch (err: any) {
    console.error('Error in auto-blog pipeline:', err)
    validationStatus.value = {
      step: 3,
      message: `❌ Pipeline failed: ${err.message || 'Error executing AI pipeline'}.`,
      success: false
    }
  } finally {
    generatingAiBlog.value = false
  }
}

const generatingCoverImg = ref(false)

const setCoverStyle = async (style: 'whatsapp' | 'instagram' | 'swarms' | 'ecommerce' | 'analytics') => {
  const prompts: Record<string, string> = {
    whatsapp: 'modern flagship smartphone on dark luxury wood desk displaying WhatsApp business chat with product card, violet ambient glow, studio photography, 8k',
    instagram: 'floating smartphone displaying Instagram direct message automated shopping interface, purple gradient lighting, 3d isometric render, 8k',
    swarms: 'futuristic artificial intelligence neural network graph connecting multiple autonomous commerce agent nodes, dark plum background, 8k',
    ecommerce: 'futuristic e-commerce store dashboard on ultra-wide monitor with real-time checkout stream, neon purple aesthetics, 8k',
    analytics: 'minimalist dark mode analytics dashboard showing conversion growth curve and revenue metrics, glowing purple violet chart, 8k'
  }

  const promptText = prompts[style] || `${newBlog.title || 'ecommerce'} conversational commerce ai workflow`
  generatingCoverImg.value = true
  try {
    const res: any = await $fetch('/api/admin/generate-image-nvidia', {
      method: 'POST',
      body: { prompt: promptText, category: newBlog.category }
    })
    if (res?.url) {
      newBlog.image = res.url
    }
  } catch {
    const seed = Math.floor(Math.random() * 900000) + 100000
    const encoded = encodeURIComponent(`${promptText}, photorealistic 8k, seed ${seed}`)
    newBlog.image = `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&model=flux&seed=${seed}&nologo=true`
  } finally {
    generatingCoverImg.value = false
  }
}

const unsplashCuratedCommercePhotos = [
  'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
]

let unsplashIndex = 0
const generateUnsplashCoverImage = () => {
  unsplashIndex = (unsplashIndex + 1) % unsplashCuratedCommercePhotos.length
  newBlog.image = unsplashCuratedCommercePhotos[unsplashIndex] || ''
}

const generateFreeAiCoverImage = async () => {
  const query = newBlog.title || newBlog.slug || 'ecommerce ai automation'
  generatingCoverImg.value = true
  try {
    const res: any = await $fetch('/api/admin/generate-image-nvidia', {
      method: 'POST',
      body: { prompt: query, category: newBlog.category }
    })
    if (res?.url) {
      newBlog.image = res.url
    }
  } catch {
    const seed = Math.floor(Math.random() * 900000) + 100000
    const cleanPrompt = encodeURIComponent(`${query} modern smartphone conversational commerce interface dark purple gradient 3d render clean banner 8k seed ${seed}`)
    newBlog.image = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1200&height=630&model=flux&seed=${seed}&nologo=true`
  } finally {
    generatingCoverImg.value = false
  }
}

const openCreateBlogModal = () => {
  editingBlogIdx.value = null
  newBlog.title = ''
  newBlog.slug = ''
  newBlog.category = 'WhatsApp Commerce'
  // Pre-fill author from saved profile so every new article uses your identity
  newBlog.author_name = aiBlogPrompt.author_name || ''
  newBlog.author_role = aiBlogPrompt.author_role || ''
  newBlog.author_photo = aiBlogPrompt.author_photo || ''
  newBlog.image = ''
  newBlog.excerpt = ''
  newBlog.content = ''
  isSlugManuallyEdited.value = false
  blogEditorMode.value = 'write'
  showBlogModal.value = true
}

const openEditBlogModal = (post: any, idx: number) => {
  editingBlogIdx.value = idx
  newBlog.title = post.title || ''
  newBlog.slug = post.slug || ''
  newBlog.category = post.category || 'WhatsApp Commerce'
  newBlog.author_name = post.author_name || post.author?.name || ''
  newBlog.author_role = post.author_role || post.author?.role || ''
  newBlog.author_photo = post.author_photo || post.author?.avatar || ''
  newBlog.image = post.image || ''
  newBlog.excerpt = post.excerpt || ''
  newBlog.content = Array.isArray(post.content) ? post.content.join('\n\n') : (post.content || '')
  isSlugManuallyEdited.value = true
  blogEditorMode.value = 'write'
  showBlogModal.value = true
}

const openFeedbackCount = computed(() => {
  return feedbackReports.value.filter((f: any) => f.status === 'open' || !f.status).length
})

const filteredFeedbackReports = computed(() => {
  return feedbackReports.value.filter((f: any) => {
    // Status filter
    if (feedbackFilterStatus.value !== 'all' && (f.status || 'open') !== feedbackFilterStatus.value) {
      return false
    }
    // Category filter
    if (feedbackFilterCategory.value !== 'all' && f.category !== feedbackFilterCategory.value) {
      return false
    }
    // Search query
    if (feedbackSearch.value.trim()) {
      const q = feedbackSearch.value.toLowerCase()
      const inTitle = (f.title || '').toLowerCase().includes(q)
      const inDesc = (f.description || '').toLowerCase().includes(q)
      const inEmail = (f.user_email || '').toLowerCase().includes(q)
      const inCat = (f.category || '').toLowerCase().includes(q)
      if (!inTitle && !inDesc && !inEmail && !inCat) return false
    }
    return true
  })
})

const isMediaImage = (att: any) => {
  if (!att) return false
  if (typeof att === 'string') {
    if (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(att) || att.startsWith('data:video/')) return false
    return /\.(jpe?g|png|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(att) || att.startsWith('data:image/') || true
  }
  if (att.isImage === true) return true
  if (att.isVideo === true) return false
  if (att.contentType && typeof att.contentType === 'string') {
    if (att.contentType.startsWith('image/')) return true
    if (att.contentType.startsWith('video/')) return false
  }
  const str = String(att.fileName || att.name || att.url || att.proxyUrl || '')
  if (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(str) || str.startsWith('data:video/')) return false
  return /\.(jpe?g|png|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(str) || str.startsWith('data:image/') || !att.isVideo
}

const getMediaUrl = (att: any) => {
  if (!att) return ''
  if (typeof att === 'string') return att
  const urlCandidate = att.proxyUrl || att.url || att.src || att.link || ''
  if (typeof urlCandidate === 'string') return urlCandidate
  return ''
}

const getMediaName = (att: any) => {
  if (!att) return 'Attachment File'
  if (typeof att === 'string') {
    const parts = att.split('/')
    return parts[parts.length - 1]?.split('?')[0] || 'Attachment File'
  }
  if (typeof att.fileName === 'string' && att.fileName.trim()) return att.fileName
  if (typeof att.name === 'string' && att.name.trim()) return att.name
  const urlStr = getMediaUrl(att)
  if (urlStr) {
    const parts = urlStr.split('/')
    return parts[parts.length - 1]?.split('?')[0] || 'Attachment File'
  }
  return 'Attachment File'
}

const previewAdminMedia = (att: any) => {
  selectedFeedbackMedia.value = att
}

const fetchFeedbackReports = async () => {
  loadingFeedback.value = true
  try {
    const res: any = await $fetch('/api/admin/feedback')
    if (res?.tickets) {
      feedbackReports.value = res.tickets
      // Pre-fill existing replies into drafts
      res.tickets.forEach((t: any) => {
        if (t.admin_reply && !replyDrafts[t.id]) {
          replyDrafts[t.id] = t.admin_reply
        }
      })
    }
  } catch (err) {
    console.error('Failed to load feedback reports from Firebase:', err)
  } finally {
    loadingFeedback.value = false
  }
}

const updateFeedbackStatus = async (ticketId: string, newStatus: string) => {
  try {
    await $fetch('/api/admin/feedback', {
      method: 'POST',
      body: { id: ticketId, status: newStatus }
    })
    const found = feedbackReports.value.find((f: any) => f.id === ticketId)
    if (found) found.status = newStatus
  } catch (err: any) {
    alert('Failed to update ticket status: ' + (err?.message || 'Server error'))
  }
}

const saveAdminTicketReply = async (ticketId: string) => {
  const reply = replyDrafts[ticketId]
  if (!reply || !reply.trim()) {
    alert('Please enter a reply message.')
    return
  }

  savingReplyId.value = ticketId
  try {
    await $fetch('/api/admin/feedback', {
      method: 'POST',
      body: {
        id: ticketId,
        admin_reply: reply.trim(),
        status: 'resolved'
      }
    })
    const found = feedbackReports.value.find((f: any) => f.id === ticketId)
    if (found) {
      found.admin_reply = reply.trim()
      found.status = 'resolved'
    }
    alert('Reply saved and sent to user successfully!')
  } catch (err: any) {
    alert('Failed to save reply: ' + (err?.message || 'Server error'))
  } finally {
    savingReplyId.value = null
  }
}

const selectedTicketIds = ref<string[]>([])
const deletingTicketId = ref<string | null>(null)
const deletingBatch = ref(false)

const isAllSelected = computed(() => {
  if (filteredFeedbackReports.value.length === 0) return false
  return filteredFeedbackReports.value.every((t: any) => selectedTicketIds.value.includes(t.id))
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedTicketIds.value = []
  } else {
    selectedTicketIds.value = filteredFeedbackReports.value.map((t: any) => t.id)
  }
}

const toggleTicketSelection = (ticketId: string) => {
  const idx = selectedTicketIds.value.indexOf(ticketId)
  if (idx > -1) {
    selectedTicketIds.value.splice(idx, 1)
  } else {
    selectedTicketIds.value.push(ticketId)
  }
}

const deleteSingleTicket = async (ticketId: string) => {
  if (!confirm('Are you sure you want to permanently delete this report?')) return

  deletingTicketId.value = ticketId
  try {
    const res: any = await $fetch('/api/admin/feedback', {
      method: 'DELETE',
      body: { id: ticketId }
    })
    if (res?.success) {
      feedbackReports.value = feedbackReports.value.filter((t: any) => t.id !== ticketId)
      selectedTicketIds.value = selectedTicketIds.value.filter(id => id !== ticketId)
    }
  } catch (err: any) {
    alert('Failed to delete report: ' + (err?.data?.statusMessage || err?.message || 'Server error'))
  } finally {
    deletingTicketId.value = null
  }
}

const deleteSelectedTickets = async () => {
  if (selectedTicketIds.value.length === 0) return
  const count = selectedTicketIds.value.length
  if (!confirm(`Are you sure you want to permanently delete ${count} selected report(s)?`)) return

  deletingBatch.value = true
  try {
    const res: any = await $fetch('/api/admin/feedback', {
      method: 'DELETE',
      body: { ids: selectedTicketIds.value }
    })
    if (res?.success) {
      const idsToDelete = new Set(selectedTicketIds.value)
      feedbackReports.value = feedbackReports.value.filter((t: any) => !idsToDelete.has(t.id))
      selectedTicketIds.value = []
    }
  } catch (err: any) {
    alert('Failed to delete selected reports: ' + (err?.data?.statusMessage || err?.message || 'Server error'))
  } finally {
    deletingBatch.value = false
  }
}

const refreshAllData = async () => {
  loading.value = true
  try {
    const [tokenRes, gapsRes, leadsRes, manageRes, convRes, feedbackRes] = await Promise.allSettled([
      $fetch('/api/admin/token-stats'),
      $fetch('/api/admin/knowledge-gaps'),
      $fetch('/api/admin/leads'),
      $fetch('/api/admin/manage?action=get_all'),
      $fetch('/api/admin/conversation-analytics'),
      $fetch('/api/admin/feedback')
    ])

    if (tokenRes.status === 'fulfilled' && (tokenRes.value as any)?.success) {
      const s = (tokenRes.value as any).stats
      tokenStats.todayTokens = s.todayTokens || 0
      tokenStats.yesterdayTokens = s.yesterdayTokens || 0
      tokenStats.allTimeTokens = s.allTimeTokens || 0
      tokenStats.featureUsage = s.featureUsage || []
    }

    if (convRes.status === 'fulfilled' && (convRes.value as any)?.success) {
      const a = (convRes.value as any).analytics
      if (a) {
        Object.assign(conversationAnalytics, a)
      }
    }

    if (gapsRes.status === 'fulfilled' && (gapsRes.value as any)?.success) {
      knowledgeGaps.value = (gapsRes.value as any).data || []
    }

    if (leadsRes.status === 'fulfilled' && (leadsRes.value as any)?.success) {
      inboxMessages.value = (leadsRes.value as any).messages || []
    }

    if (feedbackRes.status === 'fulfilled' && (feedbackRes.value as any)?.success) {
      feedbackReports.value = (feedbackRes.value as any).tickets || []
      // Pre-fill existing replies into drafts
      feedbackReports.value.forEach((t: any) => {
        if (t.admin_reply && !replyDrafts[t.id]) {
          replyDrafts[t.id] = t.admin_reply
        }
      })
    }

    if (manageRes.status === 'fulfilled' && (manageRes.value as any)?.success) {
      const data = manageRes.value as any
      blogs.value = data.blog || []
      if (data.settings) {
        Object.assign(settings, data.settings)
      }
    }
  } catch (err) {
    console.error('Error refreshing admin data:', err)
  } finally {
    loading.value = false
  }
}

const deleteLead = async (id: any, idx: number) => {
  if (confirm('Delete this inquiry permanently?')) {
    try {
      await $fetch('/api/admin/leads', { method: 'DELETE', body: { id } })
      inboxMessages.value.splice(idx, 1)
    } catch {
      alert('Deletion failed.')
    }
  }
}

const saveNewBlog = async () => {
  if (!newBlog.title || !newBlog.slug) return
  const articleSlug = newBlog.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  
  const existingCreated = editingBlogIdx.value !== null && blogs.value[editingBlogIdx.value]?.created_at
    ? blogs.value[editingBlogIdx.value].created_at
    : new Date().toISOString()

  const postData = {
    title: newBlog.title,
    slug: articleSlug,
    category: newBlog.category,
    author_name: newBlog.author_name || 'Engineering Team',
    author_role: newBlog.author_role || 'AI Commerce Specialist',
    author_photo: newBlog.author_photo || '',
    author: {
      name: newBlog.author_name || 'Engineering Team',
      role: newBlog.author_role || 'AI Commerce Specialist',
      avatar: newBlog.author_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    image: newBlog.image || '',
    excerpt: newBlog.excerpt || '',
    content: newBlog.content || '',
    created_at: existingCreated,
    updated_at: new Date().toISOString()
  }

  if (editingBlogIdx.value !== null && blogs.value[editingBlogIdx.value]) {
    blogs.value[editingBlogIdx.value] = postData
  } else {
    blogs.value.unshift(postData)
  }

  try {
    await $fetch('/api/admin/manage?action=save_all', {
      method: 'POST',
      body: { collection: 'blog', data: blogs.value }
    })
    showBlogModal.value = false
    alert(editingBlogIdx.value !== null ? 'Article updated successfully!' : 'Article published successfully!')
  } catch (err: any) {
    alert('Failed to save blog article: ' + (err?.message || 'Server error'))
  }
}

const deleteBlog = async (idx: number) => {
  const target = blogs.value[idx]
  if (!target) return

  const docId = target.slug || target.id
  if (!docId) return

  if (confirm(`Permanently delete "${target.title || docId}" from Firebase?`)) {
    try {
      blogs.value.splice(idx, 1)
      // Remove from selection if present
      selectedBlogSlugs.value = selectedBlogSlugs.value.filter((s) => s !== docId && s !== target.id)
      // Delete primary docId (slug or id) from Firestore
      await $fetch(`/api/admin/manage?action=delete&collection=blog&id=${encodeURIComponent(docId)}`)
      
      // If post had both a separate id and slug, delete id document as well for clean garbage collection
      if (target.id && target.slug && target.id !== target.slug) {
        try {
          await $fetch(`/api/admin/manage?action=delete&collection=blog&id=${encodeURIComponent(target.id)}`)
        } catch { /* ignore */ }
      }
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert('Delete failed from Firebase: ' + (err?.message || 'Server error'))
      await refreshAllData()
    }
  }
}

// ─── Multiple Blog Selection & Batch Delete ──────────────────────────────────
const selectedBlogSlugs = ref<string[]>([])
const deletingBatchBlogs = ref(false)

const isAllBlogsSelected = computed(() => {
  return blogs.value.length > 0 && selectedBlogSlugs.value.length === blogs.value.length
})

const toggleSelectAllBlogs = () => {
  if (isAllBlogsSelected.value) {
    selectedBlogSlugs.value = []
  } else {
    selectedBlogSlugs.value = blogs.value.map((b: any) => b.slug || b.id).filter(Boolean)
  }
}

const toggleSelectBlog = (slug: string) => {
  const idx = selectedBlogSlugs.value.indexOf(slug)
  if (idx > -1) {
    selectedBlogSlugs.value.splice(idx, 1)
  } else {
    selectedBlogSlugs.value.push(slug)
  }
}

const deleteSelectedBlogs = async () => {
  if (selectedBlogSlugs.value.length === 0) return
  const count = selectedBlogSlugs.value.length

  if (confirm(`Permanently delete ${count} selected article${count > 1 ? 's' : ''} from Firebase?`)) {
    deletingBatchBlogs.value = true
    try {
      const toDelete = [...selectedBlogSlugs.value]
      
      // Delete all selected documents in parallel from Firestore
      await Promise.allSettled(
        toDelete.map((id) => $fetch(`/api/admin/manage?action=delete&collection=blog&id=${encodeURIComponent(id)}`))
      )

      // Remove from local list
      blogs.value = blogs.value.filter((b: any) => !toDelete.includes(b.slug) && !toDelete.includes(b.id))
      selectedBlogSlugs.value = []
      alert(`Successfully deleted ${count} article${count > 1 ? 's' : ''} from Firebase!`)
    } catch (err: any) {
      console.error('Batch delete failed:', err)
      alert('Failed to delete some articles: ' + (err?.message || 'Server error'))
      await refreshAllData()
    } finally {
      deletingBatchBlogs.value = false
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const saveSettings = async () => {
  savingSettings.value = true
  try {
    await $fetch('/api/admin/manage?action=save_all', {
      method: 'POST',
      body: { collection: 'settings', data: [settings] }
    })
    alert('Configuration saved successfully!')
  } catch {
    alert('Failed to save configuration.')
  } finally {
    savingSettings.value = false
  }
}

onMounted(async () => {
  // Step 1: Load from localStorage instantly (no network — immediate UI restore)
  if (typeof window !== 'undefined') {
    try {
      const savedText = localStorage.getItem(AUTHOR_TEXT_KEY)
      if (savedText) {
        const parsed = JSON.parse(savedText)
        if (parsed.author_name) aiBlogPrompt.author_name = parsed.author_name
        if (parsed.author_role) aiBlogPrompt.author_role = parsed.author_role
      }
      const savedPhoto = localStorage.getItem(AUTHOR_PHOTO_KEY)
      if (savedPhoto) aiBlogPrompt.author_photo = savedPhoto

      // Legacy migration
      if (!savedText && !savedPhoto) {
        const legacy = localStorage.getItem(AUTHOR_STORAGE_KEY)
        if (legacy) {
          const parsed = JSON.parse(legacy)
          if (parsed.author_name) aiBlogPrompt.author_name = parsed.author_name
          if (parsed.author_role) aiBlogPrompt.author_role = parsed.author_role
          if (parsed.author_photo) aiBlogPrompt.author_photo = parsed.author_photo
          saveAuthorText()
          saveAuthorPhoto(parsed.author_photo || '')
        }
      }

      // Step 1b: Restore schedule from localStorage
      const savedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY)
      if (savedSchedule) {
        const parsedSched = JSON.parse(savedSchedule)
        if (typeof parsedSched.enabled === 'boolean') scheduleConfig.enabled = parsedSched.enabled
        if (parsedSched.blogsPerDay) scheduleConfig.blogsPerDay = Number(parsedSched.blogsPerDay)
        if (typeof parsedSched.runHour === 'number') scheduleConfig.runHour = Number(parsedSched.runHour)
        if (parsedSched.last_run_date) scheduleConfig.last_run_date = parsedSched.last_run_date
      }
    } catch { /* ignore */ }
  }

  // Step 2: Load from Firebase in background — overwrites local cache with canonical version
  try {
    const res: any = await $fetch('/api/admin/author-profile')
    if (res?.success && res.profile) {
      const p = res.profile
      if (p.author_name) aiBlogPrompt.author_name = p.author_name
      if (p.author_role) aiBlogPrompt.author_role = p.author_role
      if (p.author_photo) aiBlogPrompt.author_photo = p.author_photo
      // Update localStorage cache with Firebase truth
      saveAuthorText()
      saveAuthorPhoto(p.author_photo || '')
    }
  } catch { /* Firebase load failed — localStorage values remain */ }

  // Step 3: Load schedule config from Firebase
  try {
    const sched: any = await $fetch('/api/admin/blog-schedule')
    if (sched?.success && sched.config) {
      const c = sched.config
      scheduleConfig.enabled      = Boolean(c.enabled)
      scheduleConfig.blogsPerDay  = Number(c.blogsPerDay) || 1
      scheduleConfig.runHour      = Number(c.runHour) ?? 9
      scheduleConfig.last_run_date = c.last_run_date || ''
      cacheScheduleLocal()
    }
  } catch { /* ignore */ }

  refreshAllData()
})
</script>

<style scoped>
.admin-dashboard-root {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Header */
.admin-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.admin-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0 0 4px 0;
}

.admin-subtitle {
  font-size: 14px;
  color: #7C6D82;
  margin: 0;
}

/* Grid Layout */
.admin-workspace-grid {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 28px;
  align-items: start;
}

/* Sidebar */
.admin-sidebar-nav {
  position: sticky;
  top: 94px;
}

.sidebar-card {
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.16);
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(52, 31, 55, 0.03);
}

.nav-group-label {
  display: block;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #9C8EA2;
  margin: 6px 12px 12px;
}

.nav-pills-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-tab-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: #55445E;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.nav-tab-pill:hover {
  background: rgba(123, 76, 133, 0.06);
  color: #7B4C85;
}

.nav-tab-pill.is-active {
  background: #341F37;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(52, 31, 55, 0.16);
}

.badge-counter {
  margin-left: auto;
  font-size: 11px;
  font-weight: 800;
  background: rgba(123, 76, 133, 0.15);
  color: #7B4C85;
  padding: 2px 7px;
  border-radius: 9999px;
}

.badge-counter.warning {
  background: #FFE4E6;
  color: #E11D48;
}

.nav-tab-pill.is-active .badge-counter {
  background: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

/* Viewport & Cards */
.admin-viewport {
  min-width: 0;
}

.section-card {
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.16);
  border-radius: 24px;
  padding: 28px;
  margin-bottom: 25px;
  box-shadow: 0 4px 20px rgba(52, 31, 55, 0.03);
}

.card-heading {
  font-size: 20px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 6px 0;
}

.card-desc {
  font-size: 13.5px;
  color: #7C6D82;
  margin: 0 0 20px 0;
}

.card-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.metric-card {
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 14px rgba(52, 31, 55, 0.02);
}

.metric-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon-box.bg-purple { background: rgba(123, 76, 133, 0.1); color: #7B4C85; }
.metric-icon-box.bg-green { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.metric-icon-box.bg-blue { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
.metric-icon-box.bg-amber { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }

.metric-data {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #8C7E92;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  font-size: 22px;
  font-weight: 800;
  color: #341F37;
  line-height: 1.2;
  margin: 2px 0;
}

.metric-subtext {
  font-size: 11.5px;
  color: #8C7E92;
}

.metric-subtext.green {
  color: #059669;
  font-weight: 600;
}

/* Timeframe Selector Bar */
.analytics-timeframe-header {
  background: #FAF8FC;
  border: 1.5px solid rgba(123, 76, 133, 0.14);
  border-radius: 16px;
  padding: 14px 18px;
}

.ath-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.ath-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ath-label {
  font-size: 12.5px;
  font-weight: 750;
  color: #341F37;
}

.timeframe-pills-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tf-pill {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(123, 76, 133, 0.2);
  background: transparent;
  color: #6B4B73;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tf-pill:hover {
  background: rgba(123, 76, 133, 0.1);
  color: #341F37;
}

.tf-pill.active {
  background: linear-gradient(135deg, #7B4C85 0%, #341F37 100%);
  color: #FFFFFF;
  border-color: #7B4C85;
  box-shadow: 0 2px 8px rgba(123, 76, 133, 0.3);
}


/* Custom Date Drawer */
.custom-date-drawer {
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.16);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(52, 31, 55, 0.03);
}

.cdd-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cdd-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cdd-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #8C7E92;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cdd-date-input {
  border: 1.5px solid rgba(123, 76, 133, 0.2);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: #341F37;
  outline: none;
  background: #FAF8FC;
  transition: border-color 0.2s ease;
}
.cdd-date-input:focus {
  border-color: #7B4C85;
  background: #FFFFFF;
}

.cdd-arrow {
  color: #8C7E92;
  font-size: 14px;
  font-weight: 700;
  margin-top: 14px;
}

.btn-apply-custom-range {
  margin-top: 14px;
  padding: 7px 16px;
  background: linear-gradient(135deg, #7B4C85 0%, #341F37 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.btn-apply-custom-range:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.cdd-presets {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cdd-presets-title {
  font-size: 11px;
  font-weight: 700;
  color: #8C7E92;
}

.cdd-preset-btn {
  font-size: 11px;
  font-weight: 600;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 6px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.cdd-preset-btn:hover {
  background: #7B4C85;
  color: #FFFFFF;
  }

/* Channels Analytics Grid */
.channels-analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.channel-analytics-card {
  background: #FAF8FC;
  border: 1.5px solid rgba(123, 76, 133, 0.12);
  border-radius: 18px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.2s ease;
}
.channel-analytics-card:hover {
  border-color: rgba(123, 76, 133, 0.25);
  box-shadow: 0 6px 18px rgba(52, 31, 55, 0.04);
}

.channel-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.channel-brand-info {
  display: flex;
  align-items: center;
  gap: 8px;
}


.channel-brand-name {
  font-size: 13.5px;
  font-weight: 750;
  color: #341F37;
}

.channel-share-badge {
  font-size: 11px;
  font-weight: 700;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.1);
  padding: 3px 8px;
  flex: none;
  border-radius: 9999px;
}

.channel-card-numbers {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ccn-item {
  display: flex;
  flex-direction: column;
}

.ccn-label {
  font-size: 11px;
  color: #8C7E92;
  font-weight: 600;
  text-transform: uppercase;
}

.ccn-value {
  font-size: 18px;
  font-weight: 800;
  color: #341F37;
  margin-top: 2px;
}

.channel-progress-track {
  width: 100%;
  height: 6px;
  background: rgba(123, 76, 133, 0.1);
  border-radius: 9999px;
  overflow: hidden;
}

.channel-progress-bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease-out;
}

.channel-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.channel-status-pill {
  font-size: 11px;
  font-weight: 600;
  color: #059669;
}

/* Legend Pills */
.legend-pills {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64536A;
}

.legend-pill .lp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend-pill.inbound .lp-dot { background: #3B82F6; }
.legend-pill.reply .lp-dot { background: #7B4C85; }

/* Daily Tracker Table */
.daily-tracker-table-wrap {
  overflow-x: auto;
}

.daily-tracker-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.daily-tracker-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11.5px;
  font-weight: 700;
  color: #8C7E92;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid rgba(123, 76, 133, 0.14);
}

.daily-tracker-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(123, 76, 133, 0.08);
  color: #341F37;
}

.dt-date {
  font-weight: 700;
  color: #341F37;
}

.dt-inbound-badge {
  font-size: 12px;
  font-weight: 700;
  color: #2563EB;
  background: #EFF6FF;
  padding: 3px 8px;
  border-radius: 9999px;
  border: 1px solid #DBEAFE;
}

.dt-reply-badge {
  font-size: 12px;
  font-weight: 700;
  color: #7B4C85;
  background: #FDF4FF;
  padding: 3px 8px;
  border-radius: 9999px;
  border: 1px solid #F5D0FE;
}

.dt-threads-badge {
  font-size: 12px;
  font-weight: 600;
  color: #52445A;
}

.dt-rate-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 9999px;
}
.dt-rate-badge.green {
  color: #065F46;
  background: #D1FAE5;
}

.dt-bar-cell {
  width: 140px;
}

.dt-stacked-bar {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 6px;
  width: 100%;
}

.dt-bar-inbound {
  height: 100%;
  background: #3B82F6;
  border-radius: 9999px;
}

.dt-bar-reply {
  height: 100%;
  background: #7B4C85;
  border-radius: 9999px;
}

/* Services Status */
.services-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
}

.service-tile {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.12);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
}

.service-info {
  display: flex;
  flex-direction: column;
}

.service-name {
  font-size: 13px;
  font-weight: 700;
  color: #341F37;
}

.service-status {
  font-size: 11.5px;
  color: #7C6D82;
}

/* Architecture Flow Visualizer */
.architecture-diagram-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 20px;
  padding: 28px 20px;
}

.arch-node-level {
  width: 100%;
  max-width: 680px;
  display: flex;
  justify-content: center;
}

.arch-node {
  width: 100%;
  background: #FFFFFF;
  border: 1.5px solid rgba(123, 76, 133, 0.18);
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 4px 14px rgba(52, 31, 55, 0.03);
  text-align: center;
}

.arch-node-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.arch-node-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  background: rgba(123, 76, 133, 0.1);
  color: #7B4C85;
  padding: 2px 8px;
  border-radius: 9999px;
}

.arch-node-badge.primary {
  background: #341F37;
  color: #FFFFFF;
}

.arch-node-badge.critic {
  background: rgba(245, 158, 11, 0.15);
  color: #D97706;
}

.arch-node-badge.output {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

.arch-node-title {
  font-size: 14.5px;
  font-weight: 800;
  color: #341F37;
}

.arch-node-desc {
  font-size: 12.5px;
  line-height: 1.45;
  color: #6C5B72;
  margin: 0;
}

.ingress-channels-pills {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.ingress-channels-pills span {
  font-size: 11px;
  font-weight: 700;
  color: #543359;
  background: rgba(123, 76, 133, 0.08);
  padding: 3px 10px;
  border-radius: 9999px;
}

.arch-connector-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.arch-arrow {
  font-size: 16px;
  color: #7B4C85;
  font-weight: 900;
}

.arch-latency-tag {
  font-size: 10px;
  font-weight: 700;
  color: #8C7E92;
  background: #FFFFFF;
  padding: 1px 8px;
  border-radius: 9999px;
  border: 1px solid rgba(123, 76, 133, 0.12);
}

.arch-subagents-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 900px;
}

.arch-mini-card {
  background: #FFFFFF;
  border: 1.5px solid rgba(123, 76, 133, 0.2);
  border-radius: 14px;
  padding: 12px 10px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(52, 31, 55, 0.03);
}

.mini-num {
  display: inline-block;
  font-size: 9.5px;
  font-weight: 800;
  color: #7B4C85;
  margin-bottom: 4px;
}

.arch-mini-card h4 {
  font-size: 13px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 2px 0;
}

.arch-mini-card p {
  font-size: 10.5px;
  color: #7C6D82;
  margin: 0;
  line-height: 1.3;
}

.swarm-tools {
  font-size: 11.5px;
  font-family: monospace;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.06);
  padding: 4px 8px;
  border-radius: 6px;
  margin-bottom: 12px;
}

/* Channels Status Grid */
.channels-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.channel-card {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.channel-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.channel-name {
  font-size: 13.5px;
  color: #341F37;
}

.channel-route {
  font-size: 11px;
  font-family: monospace;
  color: #8C7E92;
}

.channel-status-badge {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
  background: rgba(16, 185, 129, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
  width: fit-content;
  margin-top: 4px;
}

/* Swarms Grid */
.swarms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}

.swarm-card {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.swarm-badge {
  font-size: 10px;
  font-weight: 800;
  color: #7B4C85;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.swarm-name {
  font-size: 16px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 8px 0;
}

.swarm-desc {
  font-size: 13px;
  line-height: 1.5;
  color: #64536A;
  margin: 0 0 16px 0;
}

.swarm-meta {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(84, 51, 89, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.tag-status.online {
  color: #059669;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}

/* Token Tab */
.token-counters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.token-counter-box {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.tc-label {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #8C7E92;
}

.tc-val {
  font-size: 24px;
  font-weight: 800;
  color: #7B4C85;
  margin: 4px 0 2px;
}

.tc-sub {
  font-size: 12px;
  color: #6C5B72;
}

.timeframe-toggle {
  display: flex;
  gap: 4px;
  background: #FAF8FC;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid rgba(123, 76, 133, 0.14);
}

.tf-btn {
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 7px;
  cursor: pointer;
  color: #7C6D82;
}

.tf-btn.active {
  background: #341F37;
  color: #FFFFFF;
}

.subsection-title {
  font-size: 15px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 16px;
}

.feature-bars-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fbr-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: #341F37;
}

.fbr-progress-track {
  height: 8px;
  background: #FAF8FC;
  border-radius: 9999px;
  overflow: hidden;
  border: 1px solid rgba(123, 76, 133, 0.1);
}

.fbr-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7B4C85 0%, #341F37 100%);
  border-radius: 9999px;
}

/* Knowledge Gaps */
.gaps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gap-item-card {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 16px;
  padding: 16px 20px;
}

.gap-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.gap-query-text {
  font-size: 14.5px;
  font-weight: 700;
  color: #341F37;
}

.gap-freq-badge {
  background: #FFE4E6;
  color: #E11D48;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 9999px;
}

.gap-item-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8C7E92;
}

.leads-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-purge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFF1F2;
  border: 1px solid #FECDD3;
  color: #E11D48;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-purge:hover {
  background: #E11D48;
  color: #FFFFFF;
}

.btn-clear-all {
  display: inline-flex;
  align-items: center;
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  color: #6B7280;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear-all:hover {
  background: #E5E7EB;
  color: #111827;
}

/* Clean Data Table */
.inbox-table-wrapper {
  overflow-x: auto;
}

.clean-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.clean-data-table th {
  text-align: left;
  padding: 12px 16px;
  background: #FAF8FC;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7C6D82;
  border-bottom: 1px solid rgba(123, 76, 133, 0.14);
}

.clean-data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(123, 76, 133, 0.08);
  color: #341F37;
}

.table-link {
  color: #7B4C85;
  text-decoration: none;
  font-weight: 600;
}

.msg-preview-cell {
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lead-clickable-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.lead-clickable-row:hover {
  background: rgba(123, 76, 133, 0.04);
}

.table-actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.btn-view-icon {
  background: none;
  border: none;
  color: #7B4C85;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.btn-view-icon:hover {
  background: rgba(123, 76, 133, 0.1);
}

.btn-delete-icon {
  background: none;
  border: none;
  color: #E11D48;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.btn-delete-icon:hover {
  background: #FFE4E6;
}

/* Lead Detail Modal Styles */
.lead-modal-card {
  max-width: 620px;
}

.lead-modal-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lead-avatar-bubble {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #7B4C85;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
}

.lead-modal-title {
  font-size: 18px;
  font-weight: 800;
  color: #341F37;
  margin: 0;
}

.lead-modal-email {
  font-size: 13px;
  color: #7B4C85;
  text-decoration: none;
  font-weight: 600;
}

.lead-modal-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.12);
  border-radius: 14px;
  padding: 14px;
  margin-top: 14px;
}

.lmm-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.lmm-label {
  font-size: 10.5px;
  font-weight: 800;
  color: #8C7E92;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.lmm-val {
  font-size: 12.5px;
  font-weight: 700;
  color: #341F37;
}

.tag-platform {
  color: #059669;
  background: rgba(16, 185, 129, 0.1);
  padding: 1px 8px;
  border-radius: 9999px;
  width: fit-content;
  text-transform: capitalize;
}

.tag-volume {
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.1);
  padding: 1px 8px;
  border-radius: 9999px;
  width: fit-content;
}

.lead-full-message-box {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 14px;
  padding: 16px;
  margin-top: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.lead-full-message-box p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: #341F37;
  white-space: pre-wrap;
  word-break: break-word;
}

.btn-delete-lead {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFF1F2;
  border: 1px solid #FECDD3;
  color: #E11D48;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete-lead:hover {
  background: #E11D48;
  color: #FFFFFF;
}

/* Header Actions & Select All Pill */
.blog-header-actions-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-select-all-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(123, 76, 133, 0.08);
  border: 1.5px solid rgba(123, 76, 133, 0.25);
  border-radius: 9999px;
  color: #7B4C85;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-select-all-pill:hover {
  background: #7B4C85;
  color: #FFFFFF;
  border-color: #7B4C85;
}

/* Bulk Action Bar (When 1+ cards are selected) */
.bulk-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #341F37 0%, #4A2759 100%);
  border-radius: 14px;
  padding: 12px 20px;
  color: #FFFFFF;
  box-shadow: 0 6px 20px rgba(52, 31, 55, 0.25);
  animation: slideDownBulk 0.25s ease-out;
}
@keyframes slideDownBulk {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.bulk-selected-count {
  font-size: 14px;
  font-weight: 700;
  color: #F3E8FF;
}

.bulk-action-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-bulk-delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #E11D48;
  color: #FFFFFF;
  border: none;
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.35);
}
.btn-bulk-delete:hover:not(:disabled) {
  background: #BE123C;
  transform: translateY(-1px);
}
.btn-bulk-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-bulk-cancel {
  background: transparent;
  color: #E9D5FF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-bulk-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
}

/* Blog Cards */
.blog-manage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.blog-manage-card {
  position: relative;
  background: #FAF8FC;
  border: 1.5px solid rgba(123, 76, 133, 0.14);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.blog-manage-card.is-card-selected {
  border-color: #7B4C85;
  background: #F8F1FB;
  box-shadow: 0 0 0 2px rgba(123, 76, 133, 0.25);
}

/* Card Checkbox */
.card-select-checkbox-wrap {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 5;
}

.card-select-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #7B4C85;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.bmc-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 10px;
}

.bmc-category {
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.1);
  padding: 2px 8px;
  border-radius: 9999px;
}

.bmc-date {
  color: #8C7E92;
}

.bmc-title {
  font-size: 16px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 8px 0;
  line-height: 1.35;
}

.bmc-excerpt {
  font-size: 13px;
  line-height: 1.5;
  color: #64536A;
  margin: 0 0 16px 0;
}

.bmc-image-wrapper {
  margin: -20px -20px 14px -20px;
  border-radius: 17px 17px 0 0;
  overflow: hidden;
  height: 140px;
  background: #ECE5F0;
}

.bmc-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bmc-author-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.bmc-author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.bmc-author-avatar-fallback {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #7B4C85;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bmc-author-name {
  font-size: 12px;
  font-weight: 600;
  color: #64536A;
}

.bmc-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(84, 51, 89, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bmc-slug {
  font-size: 11.5px;
  color: #7B4C85;
  text-decoration: none;
  font-family: monospace;
  font-weight: 600;
}

.bmc-slug:hover {
  text-decoration: underline;
}

/* ── Daily Auto-Scheduler Card ────────────────────────────────────────────── */

.scheduler-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.scheduler-toggle-label {
  font-size: 12px;
  font-weight: 700;
  color: #6B4B73;
}
.scheduler-master-toggle {
  position: relative;
  width: 48px;
  height: 26px;
  border-radius: 9999px;
  background: #D1C4D7;
  border: none;
  cursor: pointer;
  transition: background 0.25s ease;
  padding: 0;
}
.scheduler-master-toggle.active { background: linear-gradient(135deg, #7B4C85, #4A2759); }
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.25s ease;
}
.scheduler-master-toggle.active .toggle-knob { transform: translateX(22px); }

.scheduler-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 640px) { .scheduler-controls { grid-template-columns: 1fr; } }

/* Blogs-per-day stepper */
.blogs-per-day-control {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.bpd-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1.5px solid #7B4C85;
  background: transparent;
  color: #7B4C85;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  line-height: 1;
}
.bpd-btn:hover { background: #7B4C85; color: #fff; }
.bpd-value {
  font-size: 28px;
  font-weight: 800;
  color: #341F37;
  min-width: 40px;
  text-align: center;
}
.bpd-unit {
  font-size: 13px;
  color: #6B4B73;
  font-weight: 600;
}

/* Quick preset pills */
.bpd-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.bpd-preset-pill {
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1.5px solid #C4A8CC;
  background: transparent;
  color: #6B4B73;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.bpd-preset-pill:hover,
.bpd-preset-pill.active {
  background: linear-gradient(135deg, #7B4C85, #341F37);
  border-color: #7B4C85;
  color: #fff;
}

.field-hint {
  font-size: 11px;
  color: #8C7E92;
  margin-top: 4px;
}

/* Status row */
.scheduler-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sched-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sched-status-dot.green { background: #16A34A; box-shadow: 0 0 6px rgba(22,163,74,0.4); }
.sched-status-dot.blue  { background: #2563EB; box-shadow: 0 0 6px rgba(37,99,235,0.4); }
.sched-status-text { font-size: 12.5px; color: #52445A; }
.sched-status-text strong { color: #341F37; }

/* Scheduler action buttons */
.scheduler-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.btn-save-schedule {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #7B4C85 0%, #341F37 100%);
  color: #fff;
  border: none;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(123,76,133,0.3);
  transition: all 0.2s;
}
.btn-save-schedule:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(123,76,133,0.4); }
.btn-save-schedule:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-run-batch-now {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  background: transparent;
  border: 2px solid #7B4C85;
  color: #7B4C85;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-run-batch-now:hover:not(:disabled) { background: #7B4C85; color: #fff; }
.btn-run-batch-now:disabled { opacity: 0.6; cursor: not-allowed; }

/* Batch result */
.scheduler-result {
  font-size: 13px;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 10px;
}
.scheduler-result.success { background: #D1FAE5; color: #065F46; border: 1px solid #6EE7B7; }
.scheduler-result.error   { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
/* ──────────────────────────────────────────────────────────────────────────── */

/* AI Blog Auto-Pilot Card */
.ai-autopilot-card {
  background: linear-gradient(135deg, #FAF5FF 0%, #F5EEF8 50%, #FFFFFF 100%);
  border: 1.5px solid rgba(123, 76, 133, 0.25);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(52, 31, 55, 0.05);
}

.ai-autopilot-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.ai-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ai-sparkle-pill {
  font-size: 11px;
  font-weight: 800;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.12);
  padding: 3px 10px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ai-model-tag {
  font-size: 11px;
  font-weight: 600;
  color: #8C7E92;
}

.ai-autopilot-title {
  font-size: 19px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 6px 0;
  letter-spacing: -0.015em;
}

.ai-autopilot-sub {
  font-size: 13.5px;
  color: #64536A;
  margin: 0;
  line-height: 1.5;
}

/* Auto-Publish Toggle Switch */
.autopublish-toggle-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #FFFFFF;
  border: 1.5px solid rgba(123, 76, 133, 0.2);
  padding: 10px 16px;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(52, 31, 55, 0.04);
  flex-shrink: 0;
}

.toggle-label-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: right;
}

.toggle-title {
  font-size: 11px;
  font-weight: 700;
  color: #341F37;
}

.toggle-status-badge {
  font-size: 10.5px;
  font-weight: 800;
  border-radius: 6px;
  padding: 1px 6px;
}

.badge-on {
  color: #059669;
  background: rgba(16, 185, 129, 0.12);
}

.badge-off {
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.1);
}

.switch-toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider-round {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #D1C5D6;
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 34px;
}

.slider-round:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input:checked + .slider-round {
  background-color: #7B4C85;
}

input:checked + .slider-round:before {
  transform: translateX(20px);
}

.btn-auto-pick {
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 700;
  color: #7B4C85;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.15s ease;
}

.btn-auto-pick:hover {
  color: #341F37;
  text-decoration: underline;
}

/* Validation Pipeline Tracker */
.validation-pipeline-card {
  background: #FFFFFF;
  border: 1.5px solid rgba(123, 76, 133, 0.2);
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 4px 14px rgba(52, 31, 55, 0.04);
}

.vpc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.vpc-title {
  font-size: 12px;
  font-weight: 800;
  color: #341F37;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.vpc-score {
  font-size: 11px;
  font-weight: 800;
  color: #059669;
  background: rgba(16, 185, 129, 0.12);
  padding: 2px 8px;
  border-radius: 9999px;
}

.vpc-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.vpc-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #A191A7;
  background: #FAF8FC;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(123, 76, 133, 0.1);
  transition: all 0.2s ease;
}

.vpc-step.active {
  color: #7B4C85;
  border-color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  font-weight: 700;
}

.vpc-step.done {
  color: #059669;
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.08);
  font-weight: 700;
}

.step-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(123, 76, 133, 0.2);
  color: #341F37;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  flex-shrink: 0;
}

.vpc-step.done .step-dot {
  background: #059669;
  color: #FFFFFF;
}

.vpc-message {
  font-size: 12.5px;
  font-weight: 600;
  color: #55445E;
  margin: 0;
}

.btn-view-live-article {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #7B4C85;
  font-size: 12.5px;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.btn-view-live-article:hover {
  color: #341F37;
}

.form-row-3 {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 14px;
}

.topic-suggestions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.ts-label {
  font-size: 11px;
  font-weight: 700;
  color: #8C7E92;
}

.ts-pill {
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.18);
  border-radius: 9999px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #55445E;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ts-pill.active,
.ts-pill:hover {
  background: #7B4C85;
  color: #FFFFFF;
  border-color: #7B4C85;
}

.btn-ai-generate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #7B4C85 0%, #341F37 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(123, 76, 133, 0.3);
  transition: all 0.2s ease;
}

.btn-ai-generate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(123, 76, 133, 0.4);
}

.btn-ai-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Forms & Inputs */
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-section-sub {
  background: rgba(123, 76, 133, 0.04);
  border: 1px dashed rgba(123, 76, 133, 0.2);
  border-radius: 12px;
  padding: 12px 14px;
}

.text-req {
  color: #E11D48;
}

.text-opt {
  font-size: 10.5px;
  font-weight: 500;
  color: #8C7E92;
}

.image-live-preview {
  margin-top: 8px;
  border-radius: 10px;
  overflow: hidden;
  max-height: 120px;
  background: #ECE5F0;
}

.cover-preview-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

/* Author Photo Upload Row */
.author-photo-upload-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

/* Clickable avatar preview wrapper */
.author-avatar-preview-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid #7B4C85;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(123, 76, 133, 0.25);
  background: #ECE5F0;
  transition: border-color 0.2s ease;
}
.author-avatar-preview-wrap:hover {
  border-color: #5A2D6E;
}

.author-avatar-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.author-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #9C7AA5;
}

/* Upload icon overlay on hover */
.author-avatar-upload-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 27, 72, 0.55);
  opacity: 0;
  transition: opacity 0.2s ease;
  color: #fff;
}
.author-avatar-preview-wrap:hover .author-avatar-upload-overlay {
  opacity: 1;
}

/* Upload button */
.btn-upload-photo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #7B4C85 0%, #341F37 100%);
  color: #fff;
  border: none;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(123, 76, 133, 0.3);
  transition: all 0.2s ease;
  white-space: nowrap;
}
.btn-upload-photo:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(123, 76, 133, 0.4);
}

/* "Photo set" badge */
.author-photo-ready-tag {
  font-size: 11px;
  font-weight: 600;
  color: #16A34A;
  background: #DCFCE7;
  border: 1px solid #BBF7D0;
  border-radius: 9999px;
  padding: 3px 10px;
  white-space: nowrap;
}

/* Firebase save status badge */
.author-save-status {
  font-size: 10.5px;
  font-weight: 600;
  border-radius: 9999px;
  padding: 2px 9px;
  white-space: nowrap;
  transition: all 0.3s ease;
}
.author-save-status.saving {
  color: #92400E;
  background: #FEF3C7;
  border: 1px solid #FDE68A;
}
.author-save-status.saved {
  color: #065F46;
  background: #D1FAE5;
  border: 1px solid #6EE7B7;
}


.img-action-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.image-style-presets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

/* SEO Google Search Snippet Card */
.seo-google-card {
  background: #FFFFFF;
  border: 1.5px solid rgba(123, 76, 133, 0.16);
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 4px 12px rgba(52, 31, 55, 0.03);
}

.sgc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: #7B4C85;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(123, 76, 133, 0.15);
}

.sgc-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 800;
  color: #059669;
  background: rgba(16, 185, 129, 0.12);
  padding: 2px 8px;
  border-radius: 9999px;
}

.sgc-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-family: Arial, sans-serif;
}

.sgc-url {
  font-size: 11px;
  color: #202124;
}

.sgc-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a0dab;
  line-height: 1.3;
}

.sgc-desc {
  font-size: 12.5px;
  color: #4d5156;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Markdown Content Toolbar & Preview */
.content-toolbar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-tabs {
  display: flex;
  gap: 4px;
  background: #ECE5F0;
  padding: 3px;
  border-radius: 8px;
}

.ed-tab-btn {
  border: none;
  background: transparent;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #7C6D82;
  transition: all 0.15s ease;
}

.ed-tab-btn.active {
  background: #FFFFFF;
  color: #341F37;
  box-shadow: 0 2px 6px rgba(52, 31, 55, 0.08);
}

.md-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 10px;
  padding: 6px 10px;
}

.md-btn {
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.16);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: #55445E;
  cursor: pointer;
  transition: all 0.15s ease;
}

.md-btn:hover {
  background: #7B4C85;
  color: #FFFFFF;
  border-color: #7B4C85;
}

.alert-btn-tip {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  color: #059669;
}

.alert-btn-tip:hover {
  background: #059669 !important;
  color: #FFFFFF !important;
  border-color: #059669 !important;
}

.alert-btn-warn {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
  color: #D97706;
}

.alert-btn-warn:hover {
  background: #D97706 !important;
  color: #FFFFFF !important;
  border-color: #D97706 !important;
}

.table-btn {
  background: rgba(123, 76, 133, 0.08);
  border-color: rgba(123, 76, 133, 0.3);
  color: #7B4C85;
}

.md-stats-pill {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  padding: 2px 8px;
  border-radius: 6px;
}

.article-markdown-editor {
  min-height: 300px;
  line-height: 1.7;
  font-size: 13.5px;
  resize: vertical;
  padding: 16px 18px;
  background: #FAF8FC;
  border: 1.5px solid rgba(123, 76, 133, 0.18);
  border-radius: 12px;
  box-sizing: border-box;
}

.article-markdown-editor:focus {
  background: #FFFFFF;
  border-color: #7B4C85;
}

.md-preview-pane {
  background: #FAF8FC;
  border: 1.5px solid rgba(123, 76, 133, 0.16);
  border-radius: 12px;
  padding: 18px 22px;
  min-height: 300px;
  max-height: 460px;
  overflow-y: auto;
}

.article-preview-content {
  font-size: 13.5px;
  line-height: 1.65;
  color: #341F37;
}

.article-preview-content :deep(.article-h1) {
  font-size: 18px;
  font-weight: 800;
  color: #341F37;
  margin: 16px 0 8px 0;
}

.article-preview-content :deep(.article-h2) {
  font-size: 16px;
  font-weight: 800;
  color: #341F37;
  margin: 14px 0 6px 0;
}

.article-preview-content :deep(.article-h3) {
  font-size: 14.5px;
  font-weight: 800;
  color: #7B4C85;
  margin: 12px 0 4px 0;
}

.article-preview-content :deep(.article-h4) {
  font-size: 13.5px;
  font-weight: 700;
  color: #55445E;
  margin: 10px 0 4px 0;
}

.article-preview-content :deep(.article-quote) {
  border-left: 3px solid #7B4C85;
  background: rgba(123, 76, 133, 0.05);
  margin: 10px 0;
  padding: 8px 12px;
  border-radius: 0 8px 8px 0;
  color: #64536A;
  font-style: italic;
}

.article-preview-content :deep(.article-alert) {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  margin: 12px 0;
  font-size: 12.5px;
}

.article-preview-content :deep(.alert-tip) {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.article-preview-content :deep(.alert-warning) {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.article-preview-content :deep(.alert-info) {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.article-preview-content :deep(.alert-success) {
  background: rgba(123, 76, 133, 0.08);
  border: 1px solid rgba(123, 76, 133, 0.25);
}

.article-preview-content :deep(.article-table-wrapper) {
  overflow-x: auto;
  margin: 14px 0;
  border-radius: 8px;
  border: 1px solid rgba(123, 76, 133, 0.16);
}

.article-preview-content :deep(.article-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.article-preview-content :deep(.article-table th) {
  background: #ECE5F0;
  padding: 6px 10px;
  font-weight: 700;
  color: #341F37;
  border-bottom: 1.5px solid rgba(123, 76, 133, 0.2);
}

.article-preview-content :deep(.article-table td) {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(123, 76, 133, 0.08);
}

.article-preview-content :deep(.article-task-list) {
  list-style: none;
  padding: 0;
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.article-preview-content :deep(.task-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.article-preview-content :deep(.task-check-box) {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid rgba(123, 76, 133, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  color: #FFFFFF;
  background: #FFFFFF;
  flex-shrink: 0;
}

.article-preview-content :deep(.task-checked .task-check-box) {
  background: #7B4C85;
  border-color: #7B4C85;
}

.article-preview-content :deep(.task-checked .task-label) {
  text-decoration: line-through;
  color: #8C7E92;
}

.article-preview-content :deep(.article-video-container) {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: 10px;
  margin: 14px 0;
}

.article-preview-content :deep(.article-video-container iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.article-preview-content :deep(.article-divider) {
  border: none;
  height: 1px;
  background: rgba(123, 76, 133, 0.2);
  margin: 16px 0;
}

.article-preview-content :deep(.article-del) {
  color: #8C7E92;
  text-decoration: line-through;
}

.article-preview-content :deep(.article-code-pill) {
  background: rgba(123, 76, 133, 0.08);
  color: #7B4C85;
  padding: 2px 5px;
  border-radius: 4px;
  font-family: monospace;
}

.article-preview-content :deep(.article-code-block) {
  background: #1e1322;
  border-radius: 8px;
  overflow: hidden;
  margin: 12px 0;
}

.article-preview-content :deep(.code-block-header) {
  background: #2a1b30;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 700;
  color: #B3A1BA;
}

.article-preview-content :deep(pre) {
  margin: 0;
  padding: 10px 14px;
  overflow-x: auto;
  color: #F3EDF7;
  font-size: 12px;
  font-family: monospace;
}

.article-preview-content :deep(.article-inline-link) {
  color: #7B4C85;
  text-decoration: underline;
}

.article-preview-content :deep(.article-bullet-list) {
  padding-left: 18px;
  margin: 6px 0;
  list-style-type: disc;
}

.article-preview-content :deep(.article-numbered-list) {
  padding-left: 18px;
  margin: 6px 0;
  list-style-type: decimal;
}

.article-preview-content :deep(.article-paragraph) {
  margin: 0 0 8px 0;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-hint {
  font-size: 11px;
  color: #8C7E92;
}

.btn-sync-slug {
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 700;
  color: #7B4C85;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.15s ease;
}

.btn-sync-slug:hover {
  color: #341F37;
  text-decoration: underline;
}

.slug-input-wrapper {
  display: flex;
  align-items: center;
  background: #FAF8FC;
  border: 1.5px solid rgba(123, 76, 133, 0.16);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.slug-input-wrapper:focus-within {
  background: #FFFFFF;
  border-color: #7B4C85;
}

.slug-prefix {
  padding-left: 14px;
  font-size: 12px;
  font-family: monospace;
  color: #8C7E92;
  user-select: none;
  white-space: nowrap;
}

.slug-input-field {
  border: none !important;
  background: transparent !important;
  padding-left: 4px !important;
  font-family: monospace;
  font-size: 12.5px;
}

.slug-input-field:focus {
  border: none !important;
  box-shadow: none !important;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #55445E;
}

.clean-input {
  width: 100%;
  padding: 11px 14px;
  background: #FAF8FC;
  border: 1.5px solid rgba(123, 76, 133, 0.16);
  border-radius: 12px;
  font-size: 13.5px;
  color: #341F37;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.clean-input:focus {
  background: #FFFFFF;
  border-color: #7B4C85;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #341F37;
  color: #FFFFFF;
  border: none;
  border-radius: 9999px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #7B4C85;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.16);
  color: #55445E;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  border-color: #7B4C85;
  color: #7B4C85;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(52, 31, 55, 0.45);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 620px;
  max-height: min(90vh, 820px);
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(52, 31, 55, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  margin: auto;
}

.blog-modal-card {
  max-width: 840px !important;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(123, 76, 133, 0.1);
  background: #FFFFFF;
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 17px;
  font-weight: 800;
  color: #341F37;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 26px;
  color: #8C7E92;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s ease;
}

.modal-close-btn:hover {
  color: #341F37;
}

.modal-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.modal-form-content {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  -webkit-overflow-scrolling: touch;
}

.lead-modal-body-scroll {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  -webkit-overflow-scrolling: touch;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid rgba(123, 76, 133, 0.1);
  background: #FAF8FC;
  flex-shrink: 0;
}

/* Empty State */
.empty-state-box {
  text-align: center;
  padding: 40px 20px;
  background: #FAF8FC;
  border-radius: 18px;
  border: 1px dashed rgba(123, 76, 133, 0.2);
}

.empty-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.bmc-action-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-edit-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(123, 76, 133, 0.08);
  color: #7B4C85;
  border: 1px solid rgba(123, 76, 133, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit-icon:hover {
  background: #7B4C85;
  color: #FFFFFF;
  border-color: #7B4C85;
  transform: translateY(-1px);
}

.btn-delete-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete-icon:hover {
  background: #EF4444;
  color: #FFFFFF;
  border-color: #EF4444;
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .admin-workspace-grid {
    grid-template-columns: 1fr;
  }
  .admin-sidebar-nav {
    position: static;
  }
  .nav-pills-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .nav-tab-pill {
    width: auto;
  }
  .form-row-3 {
    grid-template-columns: 1fr;
  }
  .ai-autopilot-header {
    flex-direction: column;
    align-items: stretch;
  }
  .autopublish-toggle-box {
    justify-content: space-between;
  }
}

/* User Problem Reports & Feedback Styling */
.feedback-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-icon-wrap.bg-rose {
  background: rgba(239, 68, 68, 0.12);
  color: #DC2626;
}

.stat-icon-wrap.bg-amber {
  background: rgba(245, 158, 11, 0.14);
  color: #D97706;
}

.stat-icon-wrap.bg-emerald {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.stat-icon-wrap.bg-violet {
  background: rgba(123, 76, 133, 0.12);
  color: #7B4C85;
}

.text-rose {
  color: #DC2626 !important;
}

.text-emerald {
  color: #059669 !important;
}

.feedback-filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.ff-search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
}

.ff-search-input-wrap svg {
  position: absolute;
  left: 12px;
  color: #7C6D82;
}

.ff-search {
  padding-left: 36px !important;
  width: 100%;
}

.ff-select-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ff-select {
  padding: 8px 12px !important;
  font-size: 12px !important;
  width: auto;
  cursor: pointer;
}

.feedback-tickets-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-ticket-card {
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.16);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(52, 31, 55, 0.03);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ftc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.ftc-user-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ftc-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(123, 76, 133, 0.12);
  color: #7B4C85;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  border: 1px solid rgba(123, 76, 133, 0.2);
}

.ftc-email {
  font-size: 13.5px;
  font-weight: 700;
  color: #341F37;
}

.ftc-meta-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 11px;
  flex-wrap: wrap;
}

.ftc-category-pill {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.2);
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  color: #341F37;
}

.ftc-priority-pill {
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
}

.ftc-priority-pill.critical {
  background: rgba(239, 68, 68, 0.12);
  color: #DC2626;
}

.ftc-priority-pill.high {
  background: rgba(245, 158, 11, 0.14);
  color: #D97706;
}

.ftc-priority-pill.medium {
  background: rgba(123, 76, 133, 0.10);
  color: #7B4C85;
}

.ftc-priority-pill.low {
  background: rgba(16, 185, 129, 0.10);
  color: #059669;
}

.ftc-time {
  color: #7C6D82;
  font-size: 10.5px;
}

.ftc-status-select {
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 700;
  border: 1px solid rgba(123, 76, 133, 0.2);
  outline: none;
  cursor: pointer;
  background: #FAF8FC;
}

.ftc-body {
  font-size: 13px;
  color: #341F37;
}

.ftc-title {
  font-size: 14.5px;
  font-weight: 750;
  margin: 0 0 6px 0;
  color: #341F37;
}

.ftc-desc {
  font-size: 12.5px;
  line-height: 1.6;
  color: #4A354E;
  margin: 0;
  white-space: pre-line;
  background: #FAF8FC;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(123, 76, 133, 0.12);
}

.ftc-attachments-wrap {
  margin-top: 2px;
}

.ftc-att-heading {
  font-size: 11px;
  font-weight: 700;
  color: #7C6D82;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 8px;
}

.ftc-att-grid {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.ftc-att-card {
  width: 96px;
  border: 1px solid rgba(123, 76, 133, 0.2);
  border-radius: 10px;
  overflow: hidden;
  background: #FFFFFF;
  cursor: pointer;
  transition: transform 0.18s ease;
  flex-shrink: 0;
}

.ftc-att-card:hover {
  transform: translateY(-2px);
  border-color: #7B4C85;
}

.ftc-att-thumb-wrap {
  width: 96px;
  height: 64px;
  background: #FAF8FC;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ftc-att-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ftc-att-video-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #7B4C85;
  font-size: 9px;
  font-weight: 800;
}

.ftc-att-name {
  padding: 4px 6px;
  font-size: 10px;
  color: #341F37;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: #FFFFFF;
}

.ftc-reply-section {
  border-top: 1px solid rgba(123, 76, 133, 0.12);
  padding-top: 14px;
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ftc-existing-reply {
  background: rgba(123, 76, 133, 0.06);
  border: 1px solid rgba(123, 76, 133, 0.2);
  border-radius: 12px;
  padding: 12px 14px;
}

.ftc-reply-header {
  font-size: 11.5px;
  font-weight: 750;
  color: #7B4C85;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.ftc-reply-text {
  font-size: 12.5px;
  color: #341F37;
  line-height: 1.55;
  margin: 0;
}

.ftc-reply-input-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.feedback-batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.16);
  padding: 10px 16px;
  border-radius: 14px;
  flex-wrap: wrap;
}

.fbt-left, .fbt-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fbt-checkbox-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: #341F37;
  cursor: pointer;
  user-select: none;
}

.fbt-checkbox, .ftc-checkbox {
  width: 17px;
  height: 17px;
  accent-color: #7B4C85;
  cursor: pointer;
  border-radius: 4px;
}

.fbt-selected-count {
  font-size: 11.5px;
  font-weight: 700;
  background: rgba(123, 76, 133, 0.14);
  color: #7B4C85;
  padding: 3px 8px;
  border-radius: 6px;
}

.btn-danger-sm {
  background: #DC2626;
  color: #FFFFFF;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-danger-sm:hover:not(:disabled) {
  background: #B91C1C;
}

.btn-danger-sm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary-sm {
  background: #FFFFFF;
  color: #341F37;
  border: 1px solid rgba(123, 76, 133, 0.2);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary-sm:hover {
  background: #FAF8FC;
  border-color: #7B4C85;
}

.feedback-tickets-scroll-container {
  max-height: 720px;
  overflow-y: auto;
  padding-right: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(123, 76, 133, 0.3) transparent;
}

.feedback-tickets-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.feedback-tickets-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.feedback-tickets-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(123, 76, 133, 0.22);
  border-radius: 4px;
}

.feedback-tickets-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(123, 76, 133, 0.45);
}

.feedback-ticket-card.is-selected {
  border-color: #7B4C85;
  background: #FDFBFE;
  box-shadow: 0 0 0 1px #7B4C85, 0 4px 16px rgba(123, 76, 133, 0.08);
}

.ftc-checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 2px;
}

.ftc-delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: #DC2626;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ftc-delete-btn:hover:not(:disabled) {
  background: #DC2626;
  color: #FFFFFF;
}

.ftc-delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ftc-reply-textarea {
  flex: 1;
  min-height: 52px;
  font-size: 12px;
}

.ftc-reply-btn {
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
  height: auto;
}

@media (max-width: 640px) {
  .modal-card {
    max-height: 94vh;
    border-radius: 18px;
  }
  .form-row-2 {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .vpc-steps {
    grid-template-columns: 1fr 1fr;
  }
  .modal-header,
  .modal-form-content,
  .modal-actions,
  .lead-modal-body-scroll {
    padding-left: 16px;
    padding-right: 16px;
  }
  .ftc-reply-input-row {
    flex-direction: column;
  }
  .ftc-reply-btn {
    height: 40px;
    justify-content: center;
  }
}
</style>
