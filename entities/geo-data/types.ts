interface IRoute {
	name: string;
	segments: IRouteSegmentRef[];
	color: string;
}

interface IRouteSegmentRef {
	segment_id: number; // keyof ISegmentLib[];
	is_reversed: boolean;
}

type ISegmentLib = Map<number, ISegment>;

type ISegment = IPoint[];

type IPoint = [number, number];