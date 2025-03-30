import {CRS, LatLngExpression} from "leaflet";
import {MapContainer, Marker, Polyline, Popup, TileLayer} from "react-leaflet";

type IMapViewProps = {
	center?: LatLngExpression | undefined;
	routes: IRoute[];
}

export const MapView = ({center, routes}: IMapViewProps) => {
	return (
		<MapContainer center={center} zoom={13} style={{height: "100vh", width: "100%"}} crs={CRS.EPSG3395}>
			<TileLayer
				url='https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU'
				subdomains={['01', '02', '03', '04']}
				attribution='&copy; <a http="https://yandex.ru" target="_blank">Yandex</a> contributors'
				// onAdd={() => handleTileClick_addYandex()}
				// onRemove={() => handleTileClick_removeYandex()}
			/>
			{routes.map((t, i) =>
				<Polyline key={i} pathOptions={{color: t.color, weight: 4}} positions={t.points}/>
			)}
			{/*<Marker position={[56.838011, 60.597474]}>*/}
			{/*	<Popup>*/}
			{/*		Это центр ЕКБ*/}
			{/*	</Popup>*/}
			{/*</Marker>*/}
		</MapContainer>
	);
};