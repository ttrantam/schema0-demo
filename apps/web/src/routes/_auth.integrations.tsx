import { useQuery, useMutation } from "@tanstack/react-query";
import { client, orpc } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plug, Play, AlertTriangle, ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ActionSummary = {
  systemId: string;
  title: string;
  path?: string;
  method?: string;
};

type ActionDetails = {
  _id: string;
  title: string;
  path: string;
  method: string;
  knowledge?: string;
  ioSchema?: {
    inputSchema?: {
      properties?: Record<string, { properties?: Record<string, { type?: string; description?: string }> }>;
    };
  };
};

type Connection = {
  id: string;
  key: string;
  platform: string;
  environment: string;
  active: boolean;
};

function ActionDetailPanel({
  action,
  platform,
  onBack,
}: {
  action: ActionSummary;
  platform: string;
  onBack: () => void;
}) {
  const { data: detailsData, isLoading: detailsLoading } = useQuery(
    orpc.integrations.getActionDetails.queryOptions({
      input: { _id: action.systemId },
    }),
  );

  const details: ActionDetails | null = detailsData?.rows?.[0] ?? null;

  // Build form fields from inputSchema path/query properties
  const pathParams = details?.ioSchema?.inputSchema?.properties?.path?.properties ?? {};
  const queryParams = details?.ioSchema?.inputSchema?.properties?.query?.properties ?? {};
  const allParams = { ...pathParams, ...queryParams };
  const paramKeys = Object.keys(allParams);

  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<unknown>(null);

  const executeMutation = useMutation({
    mutationFn: (input: {
      platform: string;
      path: string;
      actionId?: string;
      method?: string;
      data?: unknown;
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
      pathParams?: Record<string, string>;
    }) => client.integrations.execute(input),
    onSuccess: (data) => {
      toast.success("Action executed");
      setResult(data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleExecute = () => {
    if (!details) return;

    const pathParamKeys = Object.keys(pathParams);
    const pathParamEntries: Record<string, string> = {};
    const queryParamEntries: Record<string, string> = {};

    for (const [key, value] of Object.entries(paramValues)) {
      if (!value) continue;
      if (pathParamKeys.includes(key)) {
        pathParamEntries[key] = value;
      } else {
        queryParamEntries[key] = value;
      }
    }

    executeMutation.mutate({
      platform,
      path: details.path,
      actionId: action.systemId,
      method: details.method,
      pathParams: Object.keys(pathParamEntries).length > 0 ? pathParamEntries : undefined,
      queryParams: Object.keys(queryParamEntries).length > 0 ? queryParamEntries : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-sm font-medium">{action.title}</h2>
          {details && (
            <p className="text-xs text-muted-foreground font-mono">
              {details.method} {details.path}
            </p>
          )}
        </div>
      </div>

      {detailsLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : details ? (
        <>
          {paramKeys.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paramKeys.map((key) => {
                  const param = allParams[key];
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium">{key}</label>
                      {param?.description && (
                        <p className="text-[11px] text-muted-foreground">{param.description}</p>
                      )}
                      <input
                        type="text"
                        value={paramValues[key] ?? ""}
                        onChange={(e) =>
                          setParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={key}
                        className="w-full bg-muted border rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full"
            onClick={handleExecute}
            disabled={executeMutation.isPending}
          >
            {executeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Execute
          </Button>

          {result && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Result
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setResult(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[300px] overflow-auto bg-muted border rounded-md px-3 py-2 text-xs font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No details available for this action.</p>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);

  const {
    data: connectionsData,
    isLoading: connectionsLoading,
    error: connectionsError,
  } = useQuery(orpc.integrations.listConnections.queryOptions({ input: {} }));

  const connections: Connection[] = connectionsData?.rows ?? [];

  const { data: actionsData, isLoading: actionsLoading } = useQuery({
    ...orpc.integrations.listActions.queryOptions({
      input: { platform: selectedPlatform!, query: submittedQuery! },
    }),
    enabled: !!selectedPlatform && !!submittedQuery,
  });

  const actions: ActionSummary[] = actionsData ?? [];

  if (connectionsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (connectionsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load integrations</p>
      </div>
    );
  }

  // Action detail view
  if (selectedAction && selectedPlatform) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Manage your connected platforms and execute actions.
          </p>
        </div>
        <ActionDetailPanel
          action={selectedAction}
          platform={selectedPlatform}
          onBack={() => setSelectedAction(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Manage your connected platforms and execute actions.
        </p>
      </div>

      {/* Connections */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Connected Platforms</h2>
        {connections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 gap-2">
              <Plug className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No connections yet</p>
              <p className="text-xs text-muted-foreground">
                Connect a platform from the settings page to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((conn) => (
              <Card
                key={conn.id}
                className={`cursor-pointer transition-colors ${
                  selectedPlatform === conn.platform
                    ? "border-primary"
                    : "hover:border-muted-foreground/30"
                }`}
                onClick={() => {
                  setSelectedPlatform(conn.platform);
                  setSelectedAction(null);
                  setSearchQuery("");
                  setSubmittedQuery(null);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {conn.platform}
                    <Badge variant="outline" className="text-[10px]">
                      {conn.environment}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground font-mono truncate">{conn.platform}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {selectedPlatform && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Search actions for {selectedPlatform}</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) setSubmittedQuery(searchQuery.trim());
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. send email, list users, create item..."
              className="flex-1 bg-muted border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" disabled={!searchQuery.trim() || actionsLoading}>
              {actionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          {submittedQuery && actions.length === 0 && !actionsLoading ? (
            <p className="text-sm text-muted-foreground">
              No actions found for "{submittedQuery}".
            </p>
          ) : actions.length > 0 ? (
            <div className="space-y-2">
              {actions.map((action) => (
                <div
                  key={action.systemId}
                  className="flex items-center justify-between border rounded-md px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedAction(action)}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{action.title}</p>
                    {action.path && (
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {action.method?.toUpperCase() || "GET"} {action.path}
                      </p>
                    )}
                    {action.tags && action.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {action.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Play className="h-3.5 w-3.5 text-muted-foreground ml-2 shrink-0" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
