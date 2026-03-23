import Fuse, { FuseResult } from "fuse.js";
import SearchIcon from "@mui/icons-material/Search";

import { useEffect, useRef, useState } from "react";
import { alpha, InputBase, ListItem, Menu, styled } from "@mui/material";
import Link from "next/link";

const Search = styled("div")(({ theme }) => ({
	position: "relative",
	borderRadius: theme.shape.borderRadius,
	backgroundColor: alpha(theme.palette.common.white, 0.15),
	"&:hover": {
		backgroundColor: alpha(theme.palette.common.white, 0.25),
	},
	marginLeft: 0,
	width: "100%",
	[theme.breakpoints.up("sm")]: {
		marginLeft: theme.spacing(1),
		width: "auto",
	},
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
	padding: theme.spacing(0, 2),
	height: "100%",
	position: "absolute",
	pointerEvents: "none",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
	color: "inherit",
	width: "100%",
	"& .MuiInputBase-input": {
		padding: theme.spacing(1, 1, 1, 0),
		paddingLeft: `calc(1em + ${theme.spacing(4)})`,
		transition: theme.transitions.create("width"),
		[theme.breakpoints.up("sm")]: {
			width: "30ch",
			"&:focus": {
				width: "50ch",
			},
		},
	},
}));

interface SearchResults {
	name: {
		id: string;
		labels: string[];
	};
	location: string;
}

export default function SearchBar() {
	const [foodList, setFoodList] = useState<SearchResults[]>([]); // Corrected type
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [anchorEl, setAnchorEl] = useState<HTMLInputElement | null>(null);
	const [results, setResults] = useState<FuseResult<SearchResults>[]>([]);
	const searchBarRef = useRef<HTMLInputElement | null>(null);
	const open = Boolean(anchorEl) && searchTerm.length > 0;
	// Fetch the data once on mount

	useEffect(() => {
		console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/all-food`);
				if (!response.ok) {
					throw new Error(`Error: ${response.statusText}`);
				}
				const data: SearchResults[] = await response.json();
				setFoodList(data);
			} catch (error) {
				console.log(`${process.env.NEXT_PUBLIC_API_URL}/all-food`);
				console.error("Error fetching food:", error);
			}
		};
		fetchData();
	}, []);

	// Update search results when `searchTerm` changes
	useEffect(() => {
		if (!searchTerm) {
			setResults([]); // Clear results if the search term is empty
			return;
		}

		const fuse = new Fuse(foodList, {
			keys: ["name.labels", "location"],
			threshold: 0.3,
		});

		const searchResults = fuse.search(searchTerm);
		console.log(searchResults);
		setResults(searchResults);
	}, [searchTerm, foodList]); // Depend only on `searchTerm` and `foodList`

	return (
		<>
			<Search ref={searchBarRef}>
				<SearchIconWrapper>
					<SearchIcon sx={{ color: "white" }} />
				</SearchIconWrapper>
				<StyledInputBase
					sx={{ color: "white" }}
					onKeyDown={(e) => {
						e.stopPropagation();
					}}
					placeholder="Search…"
					value={searchTerm}
					onFocus={(e) => {
						setAnchorEl(e.target as HTMLInputElement);
					}}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setAnchorEl(e.target as HTMLInputElement);
						e.stopPropagation();
					}}
					onBlur={() => {
						setAnchorEl(null);
					}}
				/>
			</Search>
			<Menu
				disableAutoFocus
				anchorEl={anchorEl}
				open={open}
				onClose={() => setAnchorEl(null)}
				onBlur={() => setAnchorEl(null)}
			>
				{results.length == 0 ? (
					<ListItem>No results found</ListItem>
				) : (
					results.map((result) => (
						<ListItem
							key={result.refIndex + result.item.location}
							onClick={() => setAnchorEl(null)}
						>
							<Link href={`/locations/${result.item.location}`}>
								{result.item.name.labels[0]} ({result.item.location})
							</Link>
						</ListItem>
					))
				)}
			</Menu>
		</>
	);
}
