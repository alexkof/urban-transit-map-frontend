'use client'


import dynamic from 'next/dynamic';
import {useEffect, useState} from 'react';

const MapWidget = dynamic(() => import('@/widgets/map/MapWidget'), {
	ssr: false
});

const VersionWidget = dynamic(() => import('@/widgets/map/VersionWidget'), {ssr: false});

declare global {
	interface Window {
		currentGeoFile: string | null;
	}
}

function App() {
	const [selectedFile, setSelectedFile] = useState<string>("/routes_with_segment_refs.geo.json");

	// eslint-disable-next-line
	const [selectedGeoJSON, setSelectedGeoJSON] = useState<any | null>(null);


	useEffect(() => {
		window.currentGeoFile = selectedFile;
	}, [selectedFile]);

	return (
		<div>
			<VersionWidget
				setSelectedFile={setSelectedFile}
				setSelectedGeoJSON={setSelectedGeoJSON}
			/>
			<MapWidget
				selectedFile={selectedFile}
				uploadedGeoJSON={selectedGeoJSON}
			/>
		</div>
	);
}

export default App;