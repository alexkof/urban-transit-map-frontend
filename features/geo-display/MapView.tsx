import {FeatureGroup, MapContainer, Marker, Polyline, TileLayer} from "react-leaflet";
import React, {useRef} from 'react';
import L, {CRS, LatLngExpression} from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import {EditControl} from 'react-leaflet-draw';
import 'react-leaflet-draw';
import * as turf from '@turf/turf';

type IMapViewProps = {
	routes: IRoute[];
	center?: LatLngExpression | undefined;
	segmentLib: ISegmentLib;
}


export const MapView = ({center, routes, segmentLib}: IMapViewProps) => {
	const mapRef = useRef<L.Map>(null);
	const drawControlRef = useRef<any>(null);

	const getRoutePoints = (route: IRoute): IPoint[] => {
		if (!route.segments?.length) return [];

		const points: IPoint[] = [];

		// Обрабатываем первый сегмент полностью
		const firstSegment = segmentLib.get(route.segments[0].segment_id);
		if (firstSegment) {
			points.push(...firstSegment);
		}

		// Обрабатываем остальные сегменты, добавляя только точки с индекса 1
		for (let i = 1; i < route.segments.length; i++) {
			const segmentKey = route.segments[i];
			const segmentPoints = segmentLib.get(segmentKey.segment_id);

			if (segmentPoints && segmentPoints.length > 0) {
				// Добавляем все точки, кроме первой (чтобы избежать дублирования)
				points.push(...segmentPoints.slice(1));
			}
		}

		return points;
	};


	const onCreated = (e: any) => {
		const filtered = routes.filter(route => {
			const points = getRoutePoints(route);
			if (points.length === 0) return false;

			const line = turf.lineString(points.map(p => [p[1], p[0]]));
			return turf.booleanIntersects(line, e.layer.toGeoJSON());
		});

		window.setShowRoutes(filtered);
		e.layer.remove();
	};


	return (
		<MapContainer
			ref={mapRef}

			center={center}
			zoom={13}
			style={{height: "100vh", width: "100%"}}
			crs={CRS.EPSG3395}>
			<FeatureGroup>
				<EditControl
					ref={drawControlRef}
					position="topleft"
					onCreated={onCreated}
					draw={{
						rectangle: true,
						polygon: true,
						polyline: false,
						circle: false,
						marker: false,
						circlemarker: false,
					}}
					edit={{
						remove: false,
						edit: false
					}}
				/>
			</FeatureGroup>
			<TileLayer
				url='https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU'
				subdomains={['01', '02', '03', '04']}
				attribution='&copy; <a http="https://yandex.ru" target="_blank">Yandex</a> contributors'
				// onAdd={() => handleTileClick_addYandex()}
				// onRemove={() => handleTileClick_removeYandex()}
			/>
			{routes.map((t, i) => {
					console.log(segmentLib, t.segments[0].segment_id)
					const startPoint = segmentLib.get(t.segments[0].segment_id)![0] || [0, 0];
					const endPoint = segmentLib.get(t.segments[0].segment_id)!.at(-1) || [0, 0];
					return (
						<React.Fragment key={i}>
							<Polyline
								key={i}
								pathOptions={{color: t.color, weight: 4}}
								positions={getRoutePoints(t)}
								eventHandlers={{
									click: (event) => {
										window.setShowRoutes([t]);
										console.log('Клик по полилайну', t, event);
									},
								}}
							/>
							<Marker
								position={startPoint}
								icon={L.divIcon({
									className: 'custom-text-label',
									html: `<span style="font-size: 20px; color: ${t.color}; font-weight: bold">${t.name}</span>`,
								})}/>
							<Marker
								position={endPoint}
								icon={L.divIcon({
									className: 'custom-text-label',
									html: `<span style="font-size: 20px; color: ${t.color}; font-weight: bold">${t.name}</span>`,
								})}/>

						</React.Fragment>
					);

				}
			)}
			{/*{conflicts[0]?.map((p, i) =>*/}
			{/*	<Circle key={i} center={p} pathOptions={{fillColor: 'blue'}} radius={50}/>*/}
			{/*)}*/}
			{/*{conflicts[1]?.map((p, i) =>*/}
			{/*	<Polyline key={i} pathOptions={{color: "red", weight: 20, opacity: 0.1}}*/}
			{/*						positions={[p.point1, p.point2]}>*/}
			{/*		<Tooltip permanent direction="top">{p.route.name}</Tooltip>*/}
			{/*	</Polyline>*/}
			{/*)}*/}
			{/*<Marker position={[56.838011, 60.597474]}>*/}
			{/*	<Popup>*/}
			{/*		Это центр ЕКБ*/}
			{/*	</Popup>*/}
			{/*</Marker>*/}
		</MapContainer>
	);
};