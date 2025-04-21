import React, {useEffect, useState} from "react";
import loadGeoJSON from "@/shared/api/loadGeoJSON";
import {MapView} from "@/features/geo-display/MapView";
import {LatLngExpression} from "leaflet";
import 'leaflet/dist/leaflet.css';
import {getSegmentLib} from "@/features/route-intersections/getSegmentLib";

const ekb = [56.838011, 60.597474] as LatLngExpression;
declare global {
    interface Window {
        setShowRoutes: React.Dispatch<React.SetStateAction<IRoute[]>>;
    }
}

interface MapWidgetProps {
    selectedFile: string;
    uploadedGeoJSON?: any | null;
}

const segmentLib = getSegmentLib();

export default function MapWidget({selectedFile, uploadedGeoJSON}: MapWidgetProps) {
    const [allRoutes, setAllRoutes] = useState<IRoute[]>([])
    const [showRoutes, setShowRoutes] = useState<IRoute[]>([])


    useEffect(() => {
        const f = async () => {
            let geo;
            if (uploadedGeoJSON) {
                geo = uploadedGeoJSON;
            } else {
                geo = await loadGeoJSON(selectedFile);
            }
            setAllRoutes(geo);
            setShowRoutes(geo);
            // setConflicts(_conflicts);
        };
        f();
    }, [selectedFile, uploadedGeoJSON]);


    useEffect(() => {
        const f = async () => {
            const geoJSON = await loadGeoJSON(selectedFile);
            // const geoJSON = await loadGeoJSON("/test_routes.geo.json");
            // const _conflicts = detector(geoJSON)
            setAllRoutes(geoJSON);
            setShowRoutes(geoJSON);
            //setConflicts(_conflicts);
        }
        f()
    }, [selectedFile]);

    useEffect(() => {
        window.setShowRoutes = setShowRoutes;
    }, [setShowRoutes]);

    useEffect(() => {
        console.log(showRoutes);
    }, [showRoutes]);

    return (
        <div className="relative">
            <div className="absolute top-2.5 right-2.5 size bg-white p-1.5 border border-black z-[1000] overflow-scroll w-1/6 h-fit max-h-full">
                <h3 className="text-lg font-semibold">Маршруты</h3>
                <button
                    className="block my-1.25 w-full text-left"
                    onClick={() => setShowRoutes(allRoutes)}
                >
                    Все маршруты
                </button>
                {allRoutes.map((route, index) => (
                    <button
                        key={index}
                        className="block my-1.25 w-full text-left"
                        onClick={() => setShowRoutes([route])}
                    >
                        Маршрут {route.name}
                    </button>
                ))}

            </div>
            <MapView center={ekb} routes={showRoutes} segmentLib={segmentLib}/>
        </div>
    );
};
