"use client"

import { ViewTransition } from "react"
import { AppLink } from "@/components/app-link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
            render={<SidebarMenuItem />}
          >
            {item.items?.length ? (
              <>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      tooltip={item.title}
                      render={<button />}
                      className="aria-expanded:[&_[data-chevron]]:rotate-90"
                    >
                      <ViewTransition
                        name={`nav-icon-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                        share="morph"
                      >
                        {item.icon}
                      </ViewTransition>
                      <ViewTransition
                        name={`nav-text-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                        share="text-morph"
                      >
                        <span>{item.title}</span>
                      </ViewTransition>
                      <ChevronRightIcon
                        data-chevron
                        className="ml-auto transition-transform"
                      />
                    </SidebarMenuButton>
                  }
                >
                  <span className="sr-only">Toggle</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          render={<AppLink href={subItem.url} />}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : (
              <SidebarMenuButton
                tooltip={item.title}
                render={item.url !== "#" ? <AppLink href={item.url} /> : undefined}
              >
                <ViewTransition
                  name={`nav-icon-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  share="morph"
                >
                  {item.icon}
                </ViewTransition>
                <ViewTransition
                  name={`nav-text-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  share="text-morph"
                >
                  <span>{item.title}</span>
                </ViewTransition>
              </SidebarMenuButton>
            )}
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
