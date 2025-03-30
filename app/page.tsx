'use client'


import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('@/widgets/map/MapWidget'), {
	ssr: false
});


function App() {
	return (
		<MapContainer/>
	);
}

export default App;