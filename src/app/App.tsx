import { Box, Button, Container, Stack, Typography } from "@mui/material";
import "../css/app.css";
import { RippleBadge } from "./material/MaterialTheme/styled";

function App() {
  return (
    <Container maxWidth="sm">
      <Stack direction="column">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h4">
            {" "}
            Create React on TypeScript with Redux
          </Typography>
        </Box>
        <Box>
          <RippleBadge badgeContent="10" color="primary">
            <Button variant="contained" color="secondary">
              Contained
            </Button>
          </RippleBadge>
        </Box>
      </Stack>
    </Container>
  );
}

export default App;
