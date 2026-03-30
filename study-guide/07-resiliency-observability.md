# Resiliency, Reliability & Observability

## Resiliency in Kubernetes

Resiliency = your system continues functioning when things fail. In Kubernetes, things WILL fail: pods crash, nodes go down, networks partition.

### Health Probes

The kubelet uses probes to know when to act on containers:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: matchmaking
spec:
  containers:
    - name: app
      image: matchmaking:v2
      ports:
        - containerPort: 8080

      # Is the container alive? If not → restart it
      livenessProbe:
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 15    # Wait before first check
        periodSeconds: 10          # Check every 10s
        failureThreshold: 3        # 3 failures → restart

      # Is it ready for traffic? If not → remove from Service
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        periodSeconds: 5
        failureThreshold: 2

      # Has it started? Disables liveness until success
      startupProbe:
        httpGet:
          path: /healthz
          port: 8080
        failureThreshold: 30       # 30 * 10s = 5 min to start
        periodSeconds: 10
```

**Common mistake:** Using the same endpoint for liveness and readiness. They serve different purposes:
- **Liveness**: "Is the process stuck/deadlocked?" → restart
- **Readiness**: "Can it handle requests right now?" → stop sending traffic (but don't restart)
- **Startup**: "Has it finished initializing?" → protect slow-starting apps from premature liveness kills

### Pod Disruption Budgets (PDBs)

Control how many pods can be unavailable during voluntary disruptions (node drain, cluster upgrade):

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: matchmaking-pdb
spec:
  minAvailable: 2          # At least 2 pods must always be running
  # OR
  # maxUnavailable: 1      # At most 1 pod can be down at a time
  selector:
    matchLabels:
      app: matchmaking
```

**When PDBs matter:**
- Cluster upgrades (nodes are drained one by one)
- Auto-scaling down
- Node maintenance
- Without PDBs, a drain could take all your pods down simultaneously

### Resource Management

```yaml
resources:
  requests:
    cpu: "250m"        # Guaranteed minimum (scheduling)
    memory: "256Mi"    # Guaranteed minimum
  limits:
    cpu: "1000m"       # Maximum allowed
    memory: "512Mi"    # Exceeding this → OOMKilled
```

- **Requests**: What the scheduler uses to place pods. "I need at least this much."
- **Limits**: The ceiling. CPU is throttled; memory exceeding limit = OOMKilled.
- **Best practice**: Always set both. Requests ≈ normal usage, Limits = reasonable ceiling.

**QoS Classes** (automatic based on requests/limits):
- **Guaranteed**: requests == limits for all containers. Last to be evicted.
- **Burstable**: requests < limits. Middle priority.
- **BestEffort**: No requests or limits set. First to be evicted.

### Topology Spread & Anti-Affinity

Don't put all your eggs in one basket:

```yaml
# Spread pods across availability zones
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: matchmaking

# Don't schedule two replicas on the same node
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: matchmaking
          topologyKey: kubernetes.io/hostname
```

### Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: matchmaking-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: matchmaking
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60    # Wait 60s before scaling up more
    scaleDown:
      stabilizationWindowSeconds: 300   # Wait 5 min before scaling down
```

### Circuit Breaking (Service Mesh)

Prevents cascading failures by stopping requests to unhealthy services:

```yaml
# Istio DestinationRule with circuit breaking
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: matchmaking
spec:
  host: matchmaking
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        maxRequestsPerConnection: 10
        maxRetries: 3
    outlierDetection:
      consecutive5xxErrors: 5      # 5 errors in a row
      interval: 30s                # Check every 30s
      baseEjectionTime: 30s        # Remove from pool for 30s
      maxEjectionPercent: 50       # Never eject more than 50%
```

### Retry and Timeout Policies

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: matchmaking
spec:
  hosts:
    - matchmaking
  http:
    - route:
        - destination:
            host: matchmaking
      timeout: 5s               # Fail if no response in 5s
      retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: "5xx,reset,connect-failure"
```

---

## Observability

Observability = understanding what's happening inside your system from its external outputs. Three pillars:

### 1. Metrics (Prometheus)

**What**: Numerical measurements over time. CPU usage, request count, error rate, latency.

```
┌──────────┐   scrape    ┌────────────┐   query    ┌──────────┐
│ Your App │ ←─────────  │ Prometheus │ ←───────── │ Grafana  │
│ /metrics │             │            │            │          │
└──────────┘             └────────────┘            └──────────┘
```

**How it works:**
- Your app exposes a `/metrics` endpoint (Prometheus format)
- Prometheus **scrapes** (pulls) metrics at regular intervals
- Stored as time series data
- Query with PromQL, visualize in Grafana

**Key metric types:**
- **Counter**: Only goes up. Requests total, errors total.
- **Gauge**: Goes up and down. Current memory usage, active connections.
- **Histogram**: Distribution of values. Request latency buckets.
- **Summary**: Similar to histogram but calculates quantiles client-side.

**RED Method** (for services):
- **R**ate: Requests per second
- **E**rrors: Errors per second
- **D**uration: Latency distribution

**USE Method** (for infrastructure):
- **U**tilization: How busy is the resource?
- **S**aturation: How much queued/waiting work?
- **E**rrors: Error count

**ServiceMonitor** (Prometheus Operator):
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: matchmaking
spec:
  selector:
    matchLabels:
      app: matchmaking
  endpoints:
    - port: http-metrics
      interval: 15s
      path: /metrics
```

### 2. Logs

**Structured logging** is essential at scale:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "error",
  "service": "matchmaking",
  "trace_id": "abc123",
  "message": "Failed to connect to player database",
  "error": "connection timeout after 5s",
  "player_id": "p-12345",
  "region": "us-west"
}
```

**Logging architecture:**
```
Pods → (stdout/stderr) → Node log files → Log collector (Fluentd/Fluent Bit/Vector)
                                                    │
                                              ┌─────┴─────┐
                                              ▼           ▼
                                        Elasticsearch   Loki
                                         + Kibana     + Grafana
```

**Key principles:**
- Log to stdout/stderr (not files) — Kubernetes captures it
- Use structured (JSON) logging
- Include correlation IDs (trace_id) for distributed tracing
- Set log levels appropriately (don't log DEBUG in production)
- Use a log aggregator — don't SSH into pods to read logs

### 3. Traces (Distributed Tracing)

**What**: Follows a single request across multiple services. Shows where time is spent and where failures happen.

```
Request: "Player joins matchmaking"

matchmaking-service  ████████████████████████─────────────── 250ms
  └─ player-service  ──████████────────────────────────────  80ms
  └─ lobby-service   ──────────████████████████────────────  120ms
       └─ db-query   ──────────────────████████────────────   60ms
  └─ notification    ──────────────────────────████─────────  30ms
```

**OpenTelemetry** (OTel) — the standard:
- Vendor-neutral API for metrics, logs, and traces
- Instrumentation libraries for every language
- Collector receives, processes, and exports telemetry data
- Exports to: Jaeger, Zipkin, Grafana Tempo, cloud providers

```
App (OTel SDK) → OTel Collector → Jaeger/Tempo (storage) → Grafana (visualization)
```

**Service mesh bonus:** Istio provides traces automatically for inter-service calls — no code changes needed.

### Putting It All Together: The Observability Stack

```
┌──────────────────────────────────────────────────┐
│                    Grafana                         │
│    (Unified dashboards: metrics + logs + traces)  │
├────────────┬───────────────┬─────────────────────┤
│ Prometheus │    Loki       │   Tempo/Jaeger       │
│ (metrics)  │   (logs)      │   (traces)           │
├────────────┴───────────────┴─────────────────────┤
│              OpenTelemetry Collector               │
├──────────────────────────────────────────────────┤
│     Applications + Service Mesh Sidecars          │
└──────────────────────────────────────────────────┘
```

---

## SLOs, SLAs, and SLIs

### Definitions
- **SLI** (Service Level Indicator): The measurement. "99.2% of requests returned in < 200ms"
- **SLO** (Service Level Objective): The target. "99.9% of requests should return in < 200ms"
- **SLA** (Service Level Agreement): The contract. "If we miss 99.9%, here's the penalty"

### Error Budgets
- If your SLO is 99.9% uptime, your error budget is 0.1% (about 43 minutes/month)
- As long as you have error budget remaining, you can ship fast
- When error budget is depleted, focus shifts to reliability
- This balances velocity and reliability — concrete, not subjective

### Alerting on SLOs (not symptoms)
Bad: Alert when CPU > 80%
Good: Alert when error budget burn rate is too high

```yaml
# Prometheus alert on error budget burn rate
groups:
  - name: slo-alerts
    rules:
      - alert: HighErrorBudgetBurn
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[1h]))
            /
            sum(rate(http_requests_total[1h]))
          ) > (1 - 0.999) * 14.4
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error budget burning too fast"
```

---

## Interview Questions

**Q: Your service is returning 500 errors intermittently. How do you debug it?**
A:
1. **Metrics first**: Check Grafana/Prometheus — when did it start? What's the error rate? Is it correlated with deploys, traffic spikes, or dependency issues?
2. **Traces**: Find failing requests in Jaeger/Tempo — which service in the chain is returning 500s? Is it a downstream dependency?
3. **Logs**: Filter by trace_id of failing requests — what's the actual error message?
4. **Check resources**: Is the pod OOMKilling? CPU throttling? Check resource usage vs limits.
5. **Check dependencies**: Is a database or external service degraded?
6. **Recent changes**: Was there a deployment? Config change? Infrastructure change?

**Q: How do you ensure zero-downtime deployments?**
A: Multiple layers: (1) Rolling update strategy with `maxUnavailable: 0` (always keep all old pods running until new ones are ready). (2) Readiness probes that only pass when the app can handle traffic. (3) PDBs to prevent too many pods going down during drains. (4) Pre-stop hooks with a sleep to allow in-flight requests to complete before pod termination. (5) Connection draining in the load balancer/service mesh.

**Q: What's the difference between liveness and readiness probes?**
A: Liveness asks "is this container stuck/deadlocked?" — failure triggers a restart. Readiness asks "can this container handle traffic right now?" — failure removes it from the Service endpoints but doesn't restart. Example: A pod doing a cache warmup should fail readiness (not ready for traffic) but pass liveness (process is healthy, just busy). Using the same probe for both is a common antipattern.

**Q: Explain your approach to monitoring a platform serving 1,000 developers.**
A: I'd implement all three observability pillars: metrics (Prometheus + Grafana for dashboards and alerting), logs (Loki or Elasticsearch for centralized log aggregation), and traces (Jaeger/Tempo for distributed request tracing). I'd auto-instrument everything through the platform — when a developer deploys via our Application CRD, they automatically get a ServiceMonitor, log collection, and OTel sidecar. I'd set up SLOs for platform services and alert on error budget burn rate, not raw metrics. And I'd provide a developer portal showing each service's health, SLO status, and recent deployments.

**Q: How would you handle a situation where a single team's service is consuming disproportionate resources?**
A: Prevention: ResourceQuotas per namespace enforce hard limits. LimitRanges set per-pod defaults and maximums. Response: Identify the noisy neighbor via Prometheus metrics (resource usage by namespace). Check if they need more resources (legitimate growth) or have a leak. HPA should scale horizontally within quota limits. If it's a burst pattern, consider separate node pools with autoscaling for that workload class.

**Q: What is an error budget and how does it relate to platform engineering?**
A: An error budget is the acceptable amount of unreliability based on your SLO. If your SLO is 99.9% uptime, you can be down for ~43 minutes/month. When budget is healthy, teams ship features fast. When it's depleted, focus shifts to reliability improvements. For a platform team, this means: we define SLOs for platform services (deploy time, API latency, availability), track error budget consumption, and use it to make data-driven decisions about when to prioritize features vs reliability work. It removes the subjective "is our platform reliable enough?" debate.
