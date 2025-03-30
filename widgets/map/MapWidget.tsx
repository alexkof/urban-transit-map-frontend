import {useEffect, useState} from "react";
import loadGeoJSON from "@/shared/api/loadGeoJSON";
import {MapView} from "@/features/geo-display/MapView";
import {LatLngExpression} from "leaflet";

const ekb = [56.838011, 60.597474] as LatLngExpression;
import 'leaflet/dist/leaflet.css';


export default function MapWidget(){
	const [allRoutes, setAllRoutes] = useState<IRoute[]>([])
	const [showRoutes, setShowRoutes] = useState<IRoute[]>([])

	useEffect(() => {
		const f = async () => {
			const geoJSON = await loadGeoJSON("/test_routes.geo.json");
			setAllRoutes(geoJSON);
			setShowRoutes(geoJSON);
		}
		f()
	}, []);

	useEffect(() => {
		console.log(showRoutes);
	}, [showRoutes]);

	return (
		<div className="relative">
			<div className="absolute top-2.5 right-2.5 bg-white p-1.5 border border-black z-[1000]">
				<h3 className="text-lg font-semibold">Маршруты</h3>
				{allRoutes.map((route, index) => (
					<button
						key={index}
						className="block my-1.25 w-full text-left"
						onClick={() => setShowRoutes([route])}
					>
						Маршрут {route.name}
					</button>
				))}
				<button
					className="block my-1.25 w-full text-left"
					onClick={() => setShowRoutes(allRoutes)}
				>
					Все маршруты
				</button>
			</div>
			<MapView center={ekb} routes={showRoutes}/>
		</div>
	);
};