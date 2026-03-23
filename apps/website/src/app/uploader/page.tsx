"use client";

import Link from "next/link";
import { Box, Button, Typography, Stack, Paper } from "@mui/material";

export default function UploaderHubPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 500 }}>
        <Typography variant="h4" gutterBottom>
          Select Facility
        </Typography>

        <Stack spacing={2}>
          <Button
            component={Link}
            href="/uploader/redwood-free-market"
            variant="contained"
            fullWidth
          >
            Redwood
          </Button>

          {/*
          <Button
            component={Link}
            href="/uploader/cowell-coffee-shop"
            variant="contained"
            fullWidth
          >
            Cowell
          </Button>

          <Button
            component={Link}
            href="/uploader/ethnic-resource-centers-snack-pantry"
            variant="contained"
            fullWidth
          >
            Ethnic Resource Center
          </Button>

		            <Button
            component={Link}
            href="/uploader/lionel-cantu-queer-center-food-pantry"
            variant="contained"
            fullWidth
          >
            Lionel Cantu
          </Button>

		            <Button
            component={Link}
            href="/uploader/terry-freitas-cafe"
            variant="contained"
            fullWidth
          >
            Terry Freitas
          </Button>

		            <Button
            component={Link}
            href="/uploader/produce-pop-up"
            variant="contained"
            fullWidth
          >
            Produce Pop Up
          </Button>

		            <Button
            component={Link}
            href="/uploader/womxns-center-food-pantry"
            variant="contained"
            fullWidth
          >
            Womens Center
          </Button>

		            <Button
            component={Link}
            href="/uploader/center-for-agroecology-farmstand"
            variant="contained"
            fullWidth
          >
            Agrecology
          </Button>
          */}

          <Button disabled fullWidth>
            Cowell (Coming Soon)
          </Button>

          <Button disabled fullWidth>
            Ethnic Resource Center (Coming Soon)
          </Button>

          <Button disabled fullWidth>
            Lionel Cantu (Coming Soon)
          </Button>

          <Button disabled fullWidth>
            Terry Freitas (Coming Soon)
          </Button>

          <Button disabled fullWidth>
            Produce Pop Up (Coming Soon)
          </Button>

          <Button disabled fullWidth>
            Womens Center (Coming Soon)
          </Button>

          <Button disabled fullWidth>
            Agroecology (Coming Soon)
          </Button>

        </Stack>
      </Paper>
    </Box>
  );
}
