'use client'


import dynamic from 'next/dynamic';

const MapWidget = dynamic(() => import('@/widgets/map/MapWidget'), {
    ssr: false
});


declare global {
    interface Window {
        currentGeoFile: string | null;
    }
}

function App() {


    return (
        <div>
            <MapWidget/>
        </div>
    );
}

export default App;