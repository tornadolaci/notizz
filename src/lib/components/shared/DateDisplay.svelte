<script lang="ts">
	/**
	 * DateDisplay Component
	 * Displays formatted date with relative time
	 */
	import { format, formatDistanceToNow } from 'date-fns';
	import { hu } from 'date-fns/locale';

	interface Props {
		date: Date;
		showRelative?: boolean;
		showTime?: boolean;
	}

	let { date, showRelative = true, showTime = false }: Props = $props();

	const formattedDate = $derived(() => {
		const formatString = showTime ? 'yyyy. MM. dd. HH:mm' : 'yyyy. MM. dd.';
		return format(date, formatString, { locale: hu });
	});

	const relativeTime = $derived(() => {
		if (!showRelative) return null;
		return formatDistanceToNow(date, { addSuffix: true, locale: hu });
	});
</script>

<time
	class="date-display"
	datetime={date.toISOString()}
	title={formattedDate()}
>
	{#if showRelative}
		<span class="relative-time">{relativeTime()}</span>
	{:else}
		<span class="formatted-date">{formattedDate()}</span>
	{/if}
</time>

<style>
	.date-display {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		display: inline-block;
	}

	.relative-time,
	.formatted-date {
		white-space: nowrap;
	}
</style>
