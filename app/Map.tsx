'use client';

import {MapContainer, Marker, Popup, TileLayer} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {LatLngExpression} from "leaflet";

const ekb = [56.838011, 60.597474] as LatLngExpression;

const Map = () => (
	<MapContainer center={ekb} zoom={13} style={{height: "100vh", width: "100%"}}>
		<TileLayer
			url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
		/>
		<Marker position={[56.838011, 60.597474]}>
			<Popup>
				Это центр ЕКБ
			</Popup>
		</Marker>
	</MapContainer>
);

export default Map;