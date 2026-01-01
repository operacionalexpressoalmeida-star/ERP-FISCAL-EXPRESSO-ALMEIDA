import { useErpStore } from '@/stores/useErpStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export function NotificationHub() {
  const { notifications, markNotificationAsRead } = useErpStore()

  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notificações</span>
          <span className="text-xs font-normal text-muted-foreground">
            {unreadCount} não lidas
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação recente.
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.read ? 'bg-muted/30' : ''
                }`}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div className="flex w-full items-start gap-2">
                  {getIcon(notification.type)}
                  <div className="flex-1 space-y-1">
                    <p
                      className={`text-sm leading-none ${
                        !notification.read ? 'font-semibold' : ''
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground self-end">
                  {new Date(notification.date).toLocaleDateString()}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
