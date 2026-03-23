"use client";

import Image from "next/image";
import { useState, ChangeEvent, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../utils/firebase-config";
import analyzeImage from "@/utils/cloud-vision";
import LocationData from "@/location-data.json";

async function getAuthToken(): Promise<string | undefined> {
	return auth.currentUser?.getIdToken();
}

import {
	Box,
	Button,
	CircularProgress,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Snackbar,
	Alert,
} from "@mui/material";

async function updateStatus({
	message,
	location,
}: {
	message: string;
	location: string;
}) {
	try {
		const token = await getAuthToken();
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/update-status/${location}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					...(token && { Authorization: `Bearer ${token}` }),
				},
				body: JSON.stringify({ message }),
			}
		);

		if (!response.ok) {
			throw new Error(`Error: ${response.statusText}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error fetching data:", error);
	}
}

async function updateFood({
	message,
	location,
}: {
	message: string[];
	location: string;
}) {
	try {
		const token = await getAuthToken();
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/update-food/${location}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					...(token && { Authorization: `Bearer ${token}` }),
				},
				body: JSON.stringify({ message }),
			}
		);

		if (!response.ok) {
			throw new Error(`Error: ${response.statusText}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error updating food:", error);
	}
}

interface ImageUploaderProps {
	signOut: () => void;
	location: string;
}

export default function ImageUploader({ 
	signOut, 
	location,
}: ImageUploaderProps) {
	// Specify the type as `File | null`
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState<boolean>(false);
	const [actionLoading, setActionLoading] = useState<boolean>(false); // New loading state
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [statusText, setStatusText] = useState<string>("");
	const [foodText, setFoodText] = useState<string>("");

	// Snackbar state
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
		"success"
	);

	// Food list state
	const [foodList, setFoodList] = useState<{ id: string; labels: string[] }[]>(
		[]
	);
	const [foodLoading, setFoodLoading] = useState<boolean>(false);
	const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);

	// Add PDF upload state
	const [pdfFile, setPdfFile] = useState<File | null>(null);
	const [pdfUploading, setPdfUploading] = useState<boolean>(false);
	const [pdfUploadedUrl, setPdfUploadedUrl] = useState<string | null>(null);

	// Fetch food list for the selected location (with ids)
	const fetchFoodList = async (loc = location) => {
		setFoodLoading(true);
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/food-ids/${loc}`
			);
			if (response.ok) {
				const data = await response.json();
				setFoodList(Array.isArray(data.food) ? data.food : []);
				setSelectedFoodIds([]); // Clear selection on refresh
			} else {
				setFoodList([]);
			}
		} catch {
			setFoodList([]);
		} finally {
			setFoodLoading(false);
		}
	};

	// Handle checkbox selection
	const handleSelectFood = (id: string) => {
		setSelectedFoodIds((prev) =>
			prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
		);
	};

	// Delete selected food documents
	const handleDeleteSelected = async () => {
		setFoodLoading(true);
		try {
			const token = await getAuthToken();
			await Promise.all(
				selectedFoodIds.map((id) =>
					fetch(`${process.env.NEXT_PUBLIC_API_URL}/food/${location}/${id}`, {
						method: "DELETE",
						headers: {
							...(token && { Authorization: `Bearer ${token}` }),
						},
					})
				)
			);
			await fetchFoodList();
		} catch {
			// Optionally show error
		} finally {
			setFoodLoading(false);
		}
	};

	useEffect(() => {
		fetchFoodList();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location]);

	const handleSnackbarClose = (
		_event?: React.SyntheticEvent | Event,
		reason?: string
	) => {
		if (reason === "clickaway") {
			return;
		}
		setSnackbarOpen(false);
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const selectedFile = event.target.files[0];
			// Check if file is an image
			if (selectedFile.type.startsWith("image/")) {
				setFile(selectedFile);
			} else {
				setSnackbarMessage("Please select an image file (JPG, PNG, GIF, etc.)");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
				// Clear the input
				event.target.value = "";
			}
		}
	};

	const handleUpload = async () => {
		if (!file) return;
		if (!location) return;

		setActionLoading(true); // Start loading
		setUploading(true);
		const storageRef = ref(storage, `${location}/${file.name}`);

		try {
			await uploadBytes(storageRef, file);
			const url = await getDownloadURL(storageRef);
			await analyzeImage({ url: url ?? "", location: location ?? "" });
			setUploadedUrl(url);
			setSnackbarMessage("Image uploaded successfully!");
			setSnackbarSeverity("success");
			setSnackbarOpen(true);
			console.log("File Uploaded Successfully");
			// Refresh food list after scan/upload
			await fetchFoodList();
		} catch (error) {
			console.error("Error uploading the file", error);
		} finally {
			setUploading(false);
			setActionLoading(false); // End loading
		}
	};

	// PDF file input handler
	const handlePdfFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const selectedFile = event.target.files[0];
			// Check if file is a PDF
			if (selectedFile.type === "application/pdf") {
				setPdfFile(selectedFile);
			} else {
				setSnackbarMessage("Please select a PDF file");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
				// Clear the input
				event.target.value = "";
			}
		}
	};

	// PDF scan handler
	const handlePdfScan = async () => {
		if (!pdfFile) return;
		if (!location) return;

		setActionLoading(true);
		setPdfUploading(true);
		try {
			const storageRef = ref(storage, `${location}/pdfs/${pdfFile.name}`);
			await uploadBytes(storageRef, pdfFile);
			const url = await getDownloadURL(storageRef);
			setPdfUploadedUrl(url);
			// Call backend to scan PDF
			const token = await getAuthToken();
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scan-pdf`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token && { Authorization: `Bearer ${token}` }),
				},
				body: JSON.stringify({ url, location }),
			});
			if (!response.ok) {
				throw new Error(`Error: ${response.statusText}`);
			}
			const data = await response.json();
			setSnackbarMessage(
				data.uploaded
					? `PDF scanned! ${data.uploaded} items added.`
					: data.message || "PDF scanned."
			);
			setSnackbarSeverity("success");
			setSnackbarOpen(true);
			await fetchFoodList(); // Refresh food list after scan
		} catch (error) {
			console.error("Error scanning PDF:", error);
			setSnackbarMessage("Error scanning PDF");
			setSnackbarSeverity("error");
			setSnackbarOpen(true);
		} finally {
			setPdfUploading(false);
			setActionLoading(false);
		}
	};

	return (
		<div className="flex flex-col">
			<Box
				sx={{
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					gap: 4,
					padding: 3,
					maxWidth: 1000,
					margin: "auto",
					background: "white",
				}}
			>

				{/* Uploader Section */}
				<Box sx={{ flex: 1, minWidth: 0 }}>
					{/*
					<FormControl fullWidth margin="normal">
						<InputLabel id="locations-label">Location</InputLabel>
						<Select
							labelId="locations-label"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							label="Location"
						>
							{Object.entries(LocationData).map(([key, location]) => (
								<MenuItem key={key} value={key}>
									{location.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					*/}

					<TextField
						type="file"
						fullWidth
						onChange={handleFileChange}
						margin="normal"
						variant="outlined"
						inputProps={{ accept: "image/*" }}
						InputLabelProps={{ shrink: true }}
					/>

					<Button
						variant="contained"
						fullWidth
						color="primary"
						onClick={handleUpload}
						disabled={uploading || actionLoading}
						sx={{ marginTop: 2 }}
					>
						{actionLoading ? (
							<CircularProgress size={24} color="inherit" />
						) : (
							"Upload Image"
						)}
					</Button>

					{uploadedUrl && (
						<Box sx={{ marginTop: 3, textAlign: "center" }}>
							<p>Uploaded image:</p>
							<Image
								src={uploadedUrl}
								alt="Uploaded image"
								width={300}
								height={300}
								layout="responsive"
							/>
						</Box>
					)}

					<TextField
						label="Update Status"
						fullWidth
						value={statusText}
						onChange={(e) => setStatusText(e.target.value)}
						margin="normal"
						variant="outlined"
					/>

					<Button
						variant="contained"
						color="secondary"
						onClick={async () => {
							setActionLoading(true); // Start loading
							const result = await updateStatus({
								message: statusText,
								location: location,
							});
							if (result) {
								setSnackbarMessage("Status updated successfully!");
								setSnackbarSeverity("success");
								setSnackbarOpen(true);
							}
							setActionLoading(false); // End loading
						}}
						fullWidth
						disabled={actionLoading}
						sx={{ marginTop: 2 }}
					>
						{actionLoading ? (
							<CircularProgress size={24} color="inherit" />
						) : (
							"Update Status"
						)}
					</Button>

					{/* New UI area for uploading food */}
					<TextField
						label="Update Food (comma separated)"
						fullWidth
						value={foodText}
						onChange={(e) => setFoodText(e.target.value)}
						margin="normal"
						variant="outlined"
					/>

					<Button
						variant="contained"
						color="success"
						onClick={async () => {
							setActionLoading(true); // Start loading
							const foodArray = foodText
								.split(",")
								.map((f) => f.trim())
								.filter(Boolean);
							console.log(foodArray);

							// Upload each food item individually
							let successCount = 0;
							let errorCount = 0;

							for (const foodItem of foodArray) {
								try {
									const result = await updateFood({
										message: [foodItem], // Send as single item array
										location: location,
									});
									if (result) {
										successCount++;
									} else {
										errorCount++;
									}
								} catch (error) {
									console.error(`Error uploading ${foodItem}:`, error);
									errorCount++;
								}
							}

							if (successCount > 0) {
								setSnackbarMessage(
									`Food updated successfully! ${successCount} items added${errorCount > 0 ? `, ${errorCount} failed` : ""}`
								);
								setSnackbarSeverity("success");
								setSnackbarOpen(true);
								await fetchFoodList(); // Refresh food list after update
							} else {
								setSnackbarMessage("Failed to update food items");
								setSnackbarSeverity("error");
								setSnackbarOpen(true);
							}

							setActionLoading(false); // End loading
						}}
						fullWidth
						disabled={actionLoading}
						sx={{ marginTop: 2 }}
					>
						{actionLoading ? (
							<CircularProgress size={24} color="inherit" />
						) : (
							"Update Food"
						)}
					</Button>

					{/* PDF Upload Section */}
					<TextField
						type="file"
						fullWidth
						inputProps={{ accept: ".pdf" }}
						onChange={handlePdfFileChange}
						margin="normal"
						variant="outlined"
						InputLabelProps={{ shrink: true }}
					/>
					<Button
						variant="contained"
						fullWidth
						color="primary"
						onClick={handlePdfScan}
						disabled={pdfUploading || actionLoading || !pdfFile}
						sx={{ marginTop: 2 }}
					>
						{pdfUploading ? (
							<CircularProgress size={24} color="inherit" />
						) : (
							"Scan PDF"
						)}
					</Button>
					{pdfUploadedUrl && (
						<Box sx={{ marginTop: 2, textAlign: "center" }}>
							<p>
								Uploaded PDF:{" "}
								<a href={pdfUploadedUrl} target="_blank" rel="noopener noreferrer">
									View PDF
								</a>
							</p>
						</Box>
					)}

					<Snackbar
						open={snackbarOpen}
						autoHideDuration={3000}
						onClose={handleSnackbarClose}
						anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
					>
						<Alert
							onClose={handleSnackbarClose}
							severity={snackbarSeverity}
							sx={{ width: "100%" }}
						>
							{snackbarMessage}
						</Alert>
					</Snackbar>
				</Box>

				{/* Food List Sidebar */}
				<Box
					sx={{
						flex: 1,
						minWidth: 0,
						borderLeft: { md: "1px solid #eee" },
						paddingLeft: { md: 3 },
						marginTop: { xs: 4, md: 0 },
					}}
				>
					<h3 style={{ marginTop: 0 }}>Current Food at this Location</h3>

					{foodLoading ? (
						<CircularProgress size={24} />
					) : foodList.length === 0 ? (
						<p>No food items found.</p>
					) : (
						<ul style={{ paddingLeft: 20 }}>
							{foodList.map((item) => (
								<li
									key={item.id}
									style={{ display: "flex", alignItems: "center", marginBottom: 4 }}
								>
									<input
										type="checkbox"
										checked={selectedFoodIds.includes(item.id)}
										onChange={() => handleSelectFood(item.id)}
										style={{ marginRight: 8 }}
									/>
									<span style={{ flex: 1 }}>
										{item.labels && item.labels.length > 0
											? item.labels.join(", ")
											: "(no label)"}
									</span>
								</li>
							))}
						</ul>
					)}
					{selectedFoodIds.length > 0 && (
						<Button
							variant="contained"
							color="error"
							onClick={handleDeleteSelected}
							sx={{ mb: 2 }}
						>
							Delete Selected
						</Button>
					)}
				</Box>
			</Box>
			<div style={{ padding: "20px", textAlign: "center" }}>
				<Button
					sx={{
						display: "block",
						margin: "0 auto",
						maxWidth: "200px",
						width: "100%",
					}}
					variant="contained"
					color="error"
					onClick={() => signOut()}
				>
					Sign Out
				</Button>
			</div>
		</div>
	);
}
