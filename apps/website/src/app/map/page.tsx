"use client";

import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
import MenuBar from "../../components/MenuBar";
import locationData from "@/location-data.json";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FoodIcon from "@/components/FoodIcon";
import FoodIconDesaturated from "@/components/FoodIconDesaturated";
import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Typography,
} from "@mui/material";
import Image from "next/image";

type locations = keyof typeof locationData;

interface LocationProps {
	open: boolean;
	onClose: () => void;
}

interface LocationInterface {
	location: keyof typeof locationData;
}

const activeFacilities = ["redwood-free-market"] as const;

const App = () => {
	// const router = useRouter();
	const [open, setOpen] = useState(false);
	const [location, setLocation] = useState<keyof typeof locationData>(
		"redwood-free-market",
	);

	function onClose() {
		setOpen(false);
	}

	function handleClick({ location }: LocationInterface) {
		setLocation(location);
		setOpen(true);
		console.log(location);
	}

	function LocationPopup({ open, onClose }: LocationProps) {
		const currentLocation = locationData[location];
		const router = useRouter();

		return (
			<Dialog open={open} onClose={onClose}>
				<DialogTitle>{currentLocation.name as string}</DialogTitle>
				<div className="w-full aspect-square relative bg-slate-300 h-[100vw] md:h-[30vw]">
					<Image
						src={currentLocation.image}
						className="w-full h-full object-cover"
						fill
						alt={currentLocation.name + " Picture"}
					/>
				</div>
				<DialogContent>
					<Typography>{currentLocation.about}</Typography>
				</DialogContent>

				{[
					"redwood-free-market",
					//add facility names here
					//"produce-pop-up",
					//"center-for-agroecology-farmstand",
					//"cowell-coffee-shop",
					//"ethnic-resource-centers-snack-pantry",
					//"lionel-cantu-queer-center-food-pantry",
					//"terry-freitas-cafe",
					//"womxns-center-food-pantry"
				].includes(currentLocation.dbName) ? (
					<Button
						sx={{ margin: 3, font: "lato" }}
						variant="contained"
						onClick={() => router.push(`/locations/${currentLocation.dbName}`)}
					>
						More
					</Button>
				) : (
					<Button
						sx={{ margin: 3, font: "lato" }}
						variant="outlined"
						disabled
					>
						Coming Soon
					</Button>
				)}
			</Dialog>
		);
	}

	return (
		<>
			<MenuBar />
			<APIProvider apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY as string}>
				<Map
					mapId="b82c189db6599c48"
					style={{ width: "100vw", height: "100vh" }}
					defaultCenter={{ lat: 36.993959, lng: -122.060942 }}
					defaultZoom={15}
					gestureHandling={"greedy"}
					disableDefaultUI={true}
				>
					{Object.keys(locationData).map((key) => {
						const facility = locationData[key as locations];
						return (
							<AdvancedMarker
								key={facility.name}
								position={{ lat: facility.location.lat, lng: facility.location.lng }}
								title={facility.name}
								clickable={true}
								onClick={() =>
									handleClick({ location: key as keyof typeof locationData })
								}
							>
								{[
									"redwood-free-market",
									//add facility names here
									//"produce-pop-up",
									//"center-for-agroecology-farmstand",
									//"cowell-coffee-shop",
									//"ethnic-resource-centers-snack-pantry",
									//"lionel-cantu-queer-center-food-pantry",
									//"terry-freitas-cafe",
									//"womxns-center-food-pantry"
								].includes(facility.dbName) ? (
									<FoodIcon style={{ width: "30px", height: "30px" }} />
								) : (
									<FoodIconDesaturated style={{ width: "30px", height: "30px" }} />
								)}
							</AdvancedMarker>
						);
					})}
				</Map>
				<LocationPopup open={open} onClose={onClose} />
			</APIProvider>
		</>
	);
};

export default App;
