import {FeatureGroup, MapContainer, Marker, Polyline, TileLayer, useMapEvents, ZoomControl} from "react-leaflet";
import React, {useEffect, useRef, useState} from 'react';
import L, {CRS, LatLngExpression} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import {EditControl} from 'react-leaflet-draw';
import 'react-leaflet-draw';
import * as turf from '@turf/turf';

type IMapViewProps = {
	routes: IRoute[];
	center?: LatLngExpression;
	segmentLib: ISegmentLib;
};

function ZoomEvent({setOffset, setPolylineWidth}: {
	setOffset: (offset: number) => void,
	setPolylineWidth: (width: number) => void
}) {

	const map = useMapEvents({
		zoom(e) {
			const offset = Math.pow(6, (18 / e.target._zoom));
			const width = Math.pow(2.3, (e.target._zoom/9));
			console.log(`zoom=${e.target._zoom}, offset=${offset}, width=${width}`);
			setOffset(offset);
			setPolylineWidth(width);
		},
	});
	return (
		<></>
	);
}


export const MapView = ({center = [56.838011, 60.597474], routes, segmentLib}: IMapViewProps) => {
	const mapRef = useRef<L.Map>(null);
	const drawControlRef = useRef<any>(null);
	const [offsetStep, setOffsetStep] = useState(3);
	const [polylineWidth, setPolylineWidth] = useState(3);
	const [segmentToDraw, setSegmentToDraw] = useState<{ name: string, color: string, points: IPoint[] }[]>([]);

	useEffect(() => {
		updateRoutesWithOffsets()
	}, [offsetStep, polylineWidth])

	/**
	 * Gets all segments for a route from the segment library
	 */
	const getRouteSegments = (route: IRoute): IPoint[][] => {
		return route.segments
			.map(segmentKey => {
				const segment = segmentLib.get(segmentKey.segment_id);
				return segmentKey.is_reversed ? segment?.reverse() : segment;
			})
			.filter(Boolean) as IPoint[][]; // Filter out undefined segments
	};

	/**
	 * Gets all points for a route in correct order
	 */
	const getRoutePoints = (route: IRoute): IPoint[] => {
		if (!route.segments?.length) return [];

		const points: IPoint[] = [];

		// Handle first segment
		const firstSegment = segmentLib.get(route.segments[0].segment_id);
		if (firstSegment) {
			points.push(...(route.segments[0].is_reversed ? firstSegment.reverse() : firstSegment));
		}

		// Handle remaining segments (skip first point of each to avoid duplicates)
		for (let i = 1; i < route.segments.length; i++) {
			const segmentKey = route.segments[i];
			let segmentPoints = segmentLib.get(segmentKey.segment_id)?.slice(1);

			if (segmentPoints) {
				points.push(...(segmentKey.is_reversed ? segmentPoints.reverse() : segmentPoints));
			}
		}

		return points;
	};

	/**
	 * Handles drawing completion to filter intersecting routes
	 */
	const handleDrawCreated = (e: L.LeafletEvent) => {
		const drawnLayer = e.layer;
		const drawnGeoJSON = drawnLayer.toGeoJSON();

		const intersectingRoutes = routes.filter(route => {
			const routePoints = getRoutePoints(route);
			if (routePoints.length === 0) return false;

			const routeLine = turf.lineString(routePoints.map(p => [p[1], p[0]]));
			return turf.booleanIntersects(routeLine, drawnGeoJSON);
		});

		if (window.setShowRoutes) {
			window.setShowRoutes(intersectingRoutes);
		}

		drawnLayer.remove();
	};

	const updateRoutesWithOffsets = () => {
		const segmentToRoutes = new Map<number, IRoute[]>();
		routes.forEach(route => {
			route.segments.forEach(segment => {
				const routesBefore = segmentToRoutes.get(segment.segment_id);
				segmentToRoutes.set(segment.segment_id, routesBefore ? [...routesBefore, route] : [route]);
			})
		});

		const _segmentToDraw = [] as { name: string, color: string, points: IPoint[] }[];


		for (const [segment_id, routesForSegment] of segmentToRoutes) {
			// Получаем сам сегмент из библиотеки
			const baseSegment = segmentLib.get(segment_id);
			if (!baseSegment) continue;

			const count = routesForSegment.length;

			routesForSegment.sort((a, b) => a.name.localeCompare(b.name));

			routesForSegment.forEach((route, idx) => {
				// Определяем направление сегмента для этого маршрута
				const segmentKey = route.segments.find(s => s.segment_id === segment_id);
				// Смещение: центрируем относительно 0
				let offset = 0;
				if (count > 1) {
					offset = (idx - (count - 1) / 2) * offsetStep;
				}

				// Строим смещённую линию через turf
				const turfLine = turf.lineString(baseSegment.map(p => [p[1], p[0]]));
				const offsetLine = turf.lineOffset(turfLine, offset, {units: 'meters'});
				let offsetCoords = (offsetLine.geometry.coordinates as IPoint[]).map(([lng, lat]) => [lat, lng]) as IPoint[];

				// if (segmentKey?.is_reversed) {
				// 	offsetCoords = [...baseSegment].reverse();
				// }


				_segmentToDraw.push({
					name: route.name,
					color: route.color,
					points: offsetCoords,
				});
			});
		}

		setSegmentToDraw(_segmentToDraw);
	};

	/**
	 * Renders a single route with its segments and markers (legacy method)
	 */
	const renderRoute = (route: IRoute, index: number) => {
		const segments = getRouteSegments(route);
		if (segments.length === 0) return null;

		const startPoint = segments[0][0];
		const endPoint = segments[segments.length - 1][segments[segments.length - 1].length - 1];

		return (
			<React.Fragment key={`route-${index}`}>
				{segments.map((segment, segmentIndex) => (
					<Polyline
						key={`segment-${segmentIndex}`}
						pathOptions={{color: route.color, weight: 2}}
						positions={segment}
						eventHandlers={{
							click: () => window.setShowRoutes?.([route]),
						}}
					/>
				))}

				<RouteLabel position={startPoint} color={route.color} text={route.name}/>
				<RouteLabel position={endPoint} color={route.color} text={route.name}/>
			</React.Fragment>
		);
	};

	/**
	 * Component for route labels (start/end markers)
	 */
	const RouteLabel = ({position, color, text}: { position: LatLngExpression, color: string, text: string }) => (
		<Marker
			position={position}
			icon={L.divIcon({
				className: 'custom-text-label',
				html: `<span style="font-size: 20px; color: ${color}; font-weight: bold">${text}</span>`,
			})}
		/>
	);

	return (
		<MapContainer
			ref={mapRef}
			center={center}
			zoomControl={false}
			zoom={15}
			style={{height: "100vh", width: "100%"}}
			crs={CRS.EPSG3395}
		>
			<ZoomEvent setOffset={setOffsetStep} setPolylineWidth={setPolylineWidth}/>
			<TileLayer
				url='https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU'
				subdomains={['01', '02', '03', '04']}
				// attribution='&copy; <a http="https://yandex.ru" target="_blank">Yandex</a> contributors'
			/>
			<ZoomControl position="topright"/>
			{routes.map((t, i) => {
					// console.log(t, getRoutePoints(t))
					const startPoint = segmentLib.get(t.segments[0].segment_id)?.at(0) ?? [0, 0];
					const endPoint = segmentLib.get(t.segments.at(-1)!.segment_id)?.at(-1) ?? [0, 0];
					return (
						<React.Fragment key={i}>
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
			<FeatureGroup>
				<EditControl
					ref={drawControlRef}
					position="topright"
					onCreated={handleDrawCreated}
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

			{segmentToDraw.map((segment, index) => (
				<Polyline
					key={`segment-${segment.name}_${index}`}
					positions={segment.points}
					pathOptions={{color: segment.color, weight: polylineWidth}}
				/>
			))}
		</MapContainer>
	);
};
