import { MenuItemType } from '@/app/types'
import { MenuNode } from '@core/models/multivendor.model'

/**
 * The Multivendor sidebar is built from the signed-in admin's permissions, not
 * from a static list. The backend returns a tree of main modules and their
 * sub-modules (admin_main_module / admin_sub_module filtered by
 * admin_user_permissions.can_view); this maps that tree onto the shape the
 * template's sidenav and navbar menus already render.
 *
 * The template's own demo menu has been removed - see PermissionService for the
 * live source.
 */
export function mapMenuNodes(nodes: MenuNode[]): MenuItemType[] {
  return nodes.map((node) => toMenuItem(node))
}

function toMenuItem(node: MenuNode): MenuItemType {
  const children = (node.children ?? []).filter((child) => !!child.path)

  const item: MenuItemType = {
    slug: slugFor(node),
    label: node.title,
    icon: node.icon ? toIconifyName(node.icon) : undefined,
  }

  if (children.length) {
    item.children = children.map((child) => toMenuItem(child))
  } else if (node.path) {
    item.url = node.path
  }

  return item
}

/** Stable key for the menu's expand/collapse state. */
function slugFor(node: MenuNode): string {
  if (node.sub_id !== undefined && node.sub_id !== null) {
    return 'sub-' + node.sub_id
  }
  if (node.id !== undefined && node.id !== null) {
    return 'mod-' + node.id
  }
  return node.path ?? node.title
}

/**
 * The module tables store Remix icon class names (ri-store-2-fill). The
 * template renders icons through Iconify, so translate the class name into an
 * Iconify id (ri:store-2-fill) and leave anything already namespaced alone.
 */
export function toIconifyName(icon: string): string {
  const trimmed = icon.trim()
  if (!trimmed) return ''
  if (trimmed.includes(':')) return trimmed
  if (trimmed.startsWith('ri-')) return 'ri:' + trimmed.slice(3)
  if (trimmed.startsWith('bx-') || trimmed.startsWith('bxs-')) return 'bx:' + trimmed.replace(/^bxs?-/, '')
  if (trimmed.startsWith('ti-')) return 'tabler:' + trimmed.slice(3)
  return trimmed
}
