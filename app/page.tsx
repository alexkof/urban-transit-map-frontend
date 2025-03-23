'use client'


import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('./Map'), {
	ssr: false
});


function App() {
	return (
		<MapContainer/>
	);
}

export default App;