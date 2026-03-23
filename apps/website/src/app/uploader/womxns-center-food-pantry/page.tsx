"use client";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import ImageUploader from "@/components/ImageUploader";
import { useEffect, useState } from "react";
import { auth } from "@/utils/firebase-config";
import LoginScreen from "@/components/LoginScreen";

const allowedEmails: string[] = JSON.parse(
	process.env.NEXT_PUBLIC_ALLOWED_EMAILS_WOMENS ?? "[]"
);

const Home = () => {
	const [user, setUser] = useState<User | null>(null);
	const [authorized, setAuthorized] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
			setLoading(false);
			if (firebaseUser) {
				const email = firebaseUser.email?.toLowerCase();
				if (email && allowedEmails.includes(email)) {
					setUser(firebaseUser);
					setAuthorized(true);
				} else {
					setUser(null);
					setAuthorized(false);
				}
			}
		});

		return () => unsubscribe();
	}, []);

	function handleLogout() {
		signOut(auth);
		window.location.reload();
	}

	console.log(allowedEmails);

	if (loading) {
		return <p>Loading...</p>;
	}

	return authorized && user ? (
		<div className="bg-white flex justify-center items-center">
			<ImageUploader signOut={handleLogout} location="womxns-center-food-pantry" />
		</div>
	) : (
		<LoginScreen />
	);
	
};

export default Home;