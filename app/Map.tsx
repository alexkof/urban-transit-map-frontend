'use client';

import {MapContainer, Marker, Popup, TileLayer} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {CRS, LatLngExpression} from "leaflet";

const ekb = [56.838011, 60.597474] as LatLngExpression;

//https://tiles.api-maps.yandex.ru/v1/tiles/?x=9902&y=5137&z=14&lang=ru_RU&l=map&apikey=YOUR_API_KEY
//ttps://core-renderer-tiles.maps.yandex.net/vmap2/tiles?lang=ru_RU&x=344&y=154&z=9&zmin=10&zmax=10&v=25.03.22-0~b:250311142430~ib:250225143608-23954&ads=enabled&client_id=yandex-web-maps&experimental_ranking_mode_name=default-web-ranking&auction=1&experimental_enable_direct_info_logging=1&use_permalinks_for_direct_requests=1&margin=30&experimental_data_hd=vegetation_model_exp

const Map = () => (
	<MapContainer center={ekb} zoom={13} style={{height: "100vh", width: "100%"}}
								crs={CRS.EPSG3395}>
		<TileLayer
			url='https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU'
			subdomains={['01', '02', '03', '04']}
			attribution='&copy; <a http="https://yandex.ru" target="_blank">Yandex</a> contributors'
			// onAdd={() => handleTileClick_addYandex()}
			// onRemove={() => handleTileClick_removeYandex()}
		/>
		<Marker position={[56.838011, 60.597474]}>
			<Popup>
				Это центр ЕКБ
			</Popup>
		</Marker>
	</MapContainer>
);

export default Map;