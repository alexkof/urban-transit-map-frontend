import { FeatureGroup, MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import React, { useRef } from 'react';
import L, { CRS, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import 'react-leaflet-draw';
import * as turf from '@turf/turf';

type IMapViewProps = {
	routes: IRoute[];
	center?: LatLngExpression;
	segmentLib: ISegmentLib;
};

export const MapView = ({ center = [56.838011, 60.597474], routes, segmentLib }: IMapViewProps) => {
	const mapRef = useRef<L.Map>(null);
	const drawControlRef = useRef<any>(null);

	/**
	 * Gets all segments for a route from the segment library
	 */
	const getRouteSegments = (route: IRoute): IPoint[][] => {
		return route.segments
			?.slice(1) // Skip first segment (handled separately in getRoutePoints)
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

	/**
	 * Renders a single route with its segments and markers
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
						pathOptions={{ color: route.color, weight: 4 }}
						positions={segment}
						eventHandlers={{
							click: () => window.setShowRoutes?.([route]),
						}}
					/>
				))}

				<RouteLabel position={startPoint} color={route.color} text={route.name} />
				<RouteLabel position={endPoint} color={route.color} text={route.name} />
			</React.Fragment>
		);
	};

	/**
	 * Component for route labels (start/end markers)
	 */
	const RouteLabel = ({ position, color, text }: { position: LatLngExpression, color: string, text: string }) => (
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
			zoom={13}
			style={{ height: "100vh", width: "100%" }}
			crs={CRS.EPSG3395}
		>
			<TileLayer
				url='https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU'
				subdomains={['01', '02', '03', '04']}
				attribution='&copy; <a http="https://yandex.ru" target="_blank">Yandex</a> contributors'
			/>

			<FeatureGroup>
				<EditControl
					ref={drawControlRef}
					position="topleft"
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

			{routes.map(renderRoute)}
		</MapContainer>
	);
};