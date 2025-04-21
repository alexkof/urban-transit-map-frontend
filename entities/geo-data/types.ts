interface IRoute {
	name: string;
	segments: string[]; // keyof ISegmentLib[];
	color: string;
}

type ISegmentLib = Map<string, ISegment>;

type ISegment = IPoint[];

type IPoint = [number, number];