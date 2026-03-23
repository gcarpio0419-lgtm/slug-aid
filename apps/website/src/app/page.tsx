"use client";

import * as React from "react";
import Image from "next/image";
import backgroundImage from "@/assets/BackgroundImage.jpg";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MenuBar from "@/components/MenuBar";
import { Box } from "@mui/system";

const BackgroundImage = () => {
	return (
		<Box
			sx={{
				flex: 1,
				width: "100%",
				position: "relative",
				overflow: "hidden",
			}}
		>
			<Image
				src={backgroundImage}
				alt="Center for Agroecology Farmstand"
				fill
				priority
				style={{ objectFit: "cover", objectPosition: "center" }}
			/>
			<Box
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					backgroundColor: "rgba(0, 0, 0, 0.5)",
					zIndex: 1,
				}}
			/>
			{/* Content goes here */}
			<Box
				sx={{
					position: "relative",
					zIndex: 6,
					color: "white",
					textAlign: "center",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					px: { xs: 2, sm: 4 },
				}}
			>
				<Typography
					variant="h1"
					component="h1"
					sx={{
						fontSize: { xs: "2.5rem", sm: "3.5rem", md: "6rem" },
					}}
				>
					PantryPal
				</Typography>
				<Typography
					variant="h5"
					component="p"
					sx={{
						fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
						mb: 3,
					}}
				>
					Simplifying essential services for Slugs, one step at a time.
				</Typography>
				<Button variant="contained" href="/map" size="large">
					MAP
				</Button>
			</Box>
		</Box>
	);
};


export default function Home() {
	return (
		<div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
			<MenuBar />
			<BackgroundImage />
		</div>
	);
}
