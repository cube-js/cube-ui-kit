import { Disclosure } from '@cube-dev/ui-kit';

/**
 * `Disclosure`, `Disclosure.Group` and `Disclosure.Item` take DOM attributes,
 * `theme`, `tokens` and event handlers as explicit props (CUB-5354). A spread
 * would skip the excess-property check, so these are written out.
 */
export function DisclosureWithDomProps({ onEnter }: { onEnter: () => void }) {
  return (
    <Disclosure
      id="query"
      className="query"
      style={{ marginTop: 8 }}
      theme="danger"
      tokens={{ '$disclosure-transition': '200ms' }}
      data-section="query"
      aria-describedby="query-hint"
      onPointerEnter={onEnter}
    >
      <Disclosure.Trigger>Query</Disclosure.Trigger>
      <Disclosure.Content>SQL</Disclosure.Content>
    </Disclosure>
  );
}

export function DisclosureGroupWithDomProps({
  onEnter,
}: {
  onEnter: () => void;
}) {
  return (
    <Disclosure.Group id="sections" data-section="all" onMouseEnter={onEnter}>
      <Disclosure.Item id="one" data-section="one" onPointerEnter={onEnter}>
        <Disclosure.Trigger>One</Disclosure.Trigger>
        <Disclosure.Content>First</Disclosure.Content>
      </Disclosure.Item>
    </Disclosure.Group>
  );
}
