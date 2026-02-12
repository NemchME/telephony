import { Alert, Card, CardContent, Typography } from "@mui/material";

export function LiveBundlesPanel() {
  // В будущем тут будет useSelector(selectBundles) из bundleSlice
  const bundles: any[] = [];

  if (!bundles.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Live Calls
          </Typography>
          <Alert severity="info">
            Пока нет данных. Следующий шаг — подключить WebSocket (/ws) и складывать BundleState в store.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return null;
}