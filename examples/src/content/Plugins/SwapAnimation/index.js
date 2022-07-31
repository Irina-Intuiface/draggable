// eslint-disable-next-line import/no-unresolved
import { Sortable, Plugins } from '@shopify/draggable';

export default function PluginsSwapAnimation() {
	const containers = document.querySelectorAll('#SwapAnimation .block-layout');

	if (containers.length === 0) {
		return false;
	}

	const sortable = new Sortable(containers, {
		draggable: '.Block--isDraggable',
		mirror: {
			constrainDimensions: true
		},
		plugins: [Plugins.SwapAnimation],
		swapAnimation: {
			duration: 200,
			easingFunction: 'ease-in-out'
		}
	});

	return sortable;
}
