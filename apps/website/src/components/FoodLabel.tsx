// defines the inventory statuses that a food card can display
type Availability = "in_stock" | "running_out" | "out_of_stock";

interface FoodLabelprops {
	label: string;
	availability: Availability;
}

// maps each availability value to accessible status text and color styling
const availabilityStyles: Record<Availability, {text: string; classes: string;}> = {
	in_stock: {
		text: "IN STOCK",
		classes: "border-green-300 bg-green-100 text-green-800",
	},
	running_out: {
		text: "RUNNING OUT",
		classes: "border-yellow-300 bg-yellow-100 text-yellow-800",
	},
	out_of_stock: {
		text: "OUT OF STOCK",
		classes: "border-red-300 bg-red-100 text-red-800",
	},
};

export default function FoodLabel({ label, availability, }: FoodLabelprops) {
	const status = availabilityStyles[availability];
	// Function to add breaks for words longer than 10 characters and at the beginning of numbers
	const addBreaks = (text: string) => {
		return text
			.split(" ")
			.map((word) => {
				if (word.length > 10) {
					// First, add soft breaks before numbers
					let processedWord = word.replace(/(\d+)/g, "\u200B$1");
					// Then, insert a soft break every 10 characters
					processedWord = processedWord
						.replace(/(.{10})/g, "$1\u200B")
						.replace(/\u200B$/, "");
					return processedWord;
				}
				return word;
			})
			.join(" ");
	};

	return (
		<div className="flex flex-col items-center justify-center gap-2 rounded-md p-2 py-4 text-center text-2xl font-semibold text-slugSecondaryBlue shadow-md">
			<p className="break-words">
				{addBreaks(label)}
			</p>

			<span
				className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${status.classes}`}
			>
				{status.text}
			</span>
		</div>
	);
}
