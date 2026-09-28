import { Route } from 'lucide-react'
import { ROUTE_META } from '../../runtime/router'
import { Badge } from '../ui/Badge'

export function RouteBadge({ route, confidence, className }) {
  const meta = ROUTE_META[route] || ROUTE_META.core
  return (
    <Badge tone={meta.accent} icon={Route} className={className}>
      {meta.label}
      {typeof confidence === 'number' ? (
        <span className="opacity-70"> · {(confidence * 100).toFixed(0)}%</span>
      ) : null}
    </Badge>
  )
}
