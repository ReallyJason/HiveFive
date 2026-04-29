import React from "react";
import { fontSans, fontDisplay } from "../lib/fonts";
import { HONEY, CHARCOAL, CREAM, SEMANTIC } from "../lib/constants";
import { DEMO_MESSAGES, type DemoMessage } from "../data/demo-data";
import { NavBar } from "../components/NavBar";
import { Avatar } from "../components/Avatar";

type MessagingProps = {
  visibleMessageCount?: number;
  showTyping?: boolean;
};

type ConversationPreview = {
  name: string;
  initial: string;
  lastMessage: string;
  time: string;
  unread: boolean;
};

const CONVERSATION_LIST: ConversationPreview[] = [
  {
    name: "Marcus Rivera",
    initial: "M",
    lastMessage: "Let me put together a timeline...",
    time: "10:31 AM",
    unread: false,
  },
  {
    name: "Aisha Patel",
    initial: "A",
    lastMessage: "Sounds good, I'll send the draft tonight!",
    time: "9:15 AM",
    unread: true,
  },
  {
    name: "David Chen",
    initial: "D",
    lastMessage: "Thanks for the session yesterday",
    time: "Yesterday",
    unread: false,
  },
  {
    name: "Elena Kovacs",
    initial: "E",
    lastMessage: "The photos are ready for review",
    time: "Mon",
    unread: true,
  },
];

const LEFT_PANE_WIDTH = 380;
const UNREAD_DOT_SIZE = 8;

export const Messaging: React.FC<MessagingProps> = ({
  visibleMessageCount = 5,
  showTyping = false,
}) => {
  const visibleMessages = DEMO_MESSAGES.slice(0, visibleMessageCount);

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: CREAM[50],
        fontFamily: fontSans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar activeLink="Messages" />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left pane — conversation list */}
        <div
          style={{
            width: LEFT_PANE_WIDTH,
            borderRight: `1px solid ${CHARCOAL[100]}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${CHARCOAL[100]}`,
            }}
          >
            <div
              style={{
                fontFamily: fontDisplay,
                fontStyle: "italic",
                fontSize: 24,
                color: CHARCOAL[900],
                marginBottom: 16,
              }}
            >
              Messages
            </div>
            <div
              style={{
                height: 36,
                borderRadius: 8,
                backgroundColor: CHARCOAL[50],
                border: `1px solid ${CHARCOAL[200]}`,
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                fontSize: 13,
                color: CHARCOAL[400],
              }}
            >
              Search conversations...
            </div>
          </div>

          {/* Conversation entries */}
          {CONVERSATION_LIST.map((conversation, conversationIndex) => {
            const isSelected = conversationIndex === 0;
            return (
              <div
                key={conversation.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 24px",
                  backgroundColor: isSelected ? HONEY[50] : "transparent",
                  borderLeft: isSelected
                    ? `3px solid ${HONEY[500]}`
                    : "3px solid transparent",
                }}
              >
                <Avatar size={40} initial={conversation.initial} online={isSelected} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: conversation.unread ? 700 : 500,
                        color: CHARCOAL[900],
                      }}
                    >
                      {conversation.name}
                    </span>
                    <span style={{ fontSize: 11, color: CHARCOAL[400] }}>
                      {conversation.time}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: conversation.unread ? CHARCOAL[700] : CHARCOAL[400],
                        fontWeight: conversation.unread ? 500 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {conversation.lastMessage}
                    </span>
                    {conversation.unread && (
                      <div
                        style={{
                          width: UNREAD_DOT_SIZE,
                          height: UNREAD_DOT_SIZE,
                          borderRadius: "50%",
                          backgroundColor: HONEY[500],
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right pane — active thread */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Thread header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 32px",
              borderBottom: `1px solid ${CHARCOAL[100]}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar size={40} initial="M" online />
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: CHARCOAL[900],
                  }}
                >
                  Marcus Rivera
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: SEMANTIC.success,
                    fontWeight: 500,
                  }}
                >
                  Online
                </div>
              </div>
            </div>
            {/* Context badge: linked order */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                backgroundColor: HONEY[50],
                border: `1px solid ${HONEY[200]}`,
                fontSize: 12,
                fontWeight: 600,
                color: HONEY[700],
              }}
            >
              <span style={{ fontSize: 14 }}>📋</span>
              Order #1042 — Full-Stack Web App
            </div>
          </div>

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              padding: "28px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "hidden",
            }}
          >
            {visibleMessages.map((message: DemoMessage, messageIndex: number) => {
              const isClient = message.sender === "client";

              return (
                <div
                  key={messageIndex}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isClient ? "flex-end" : "flex-start",
                  }}
                >
                  {/* Avatar row for provider messages */}
                  {!isClient && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 10,
                        maxWidth: 560,
                      }}
                    >
                      <Avatar size={28} initial="M" />
                      <div
                        style={{
                          backgroundColor: CHARCOAL[50],
                          borderRadius: "16px 16px 16px 4px",
                          padding: "12px 16px",
                          maxWidth: 520,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: CHARCOAL[800],
                          }}
                        >
                          {message.text}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Client messages */}
                  {isClient && (
                    <div style={{ maxWidth: 560 }}>
                      <div
                        style={{
                          backgroundColor: HONEY[500],
                          borderRadius: "16px 16px 4px 16px",
                          padding: "12px 16px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: CHARCOAL[900],
                          }}
                        >
                          {message.text}
                        </div>

                        {/* Link preview card */}
                        {message.isLink && message.linkTitle && (
                          <div
                            style={{
                              marginTop: 10,
                              backgroundColor: "rgba(0,0,0,0.08)",
                              borderRadius: 10,
                              padding: "10px 14px",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                backgroundColor: "rgba(255,255,255,0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 16,
                                flexShrink: 0,
                              }}
                            >
                              🔗
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: CHARCOAL[900],
                                  marginBottom: 2,
                                }}
                              >
                                {message.linkTitle}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: CHARCOAL[700],
                                }}
                              >
                                {message.linkDomain}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Read receipt */}
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: 11,
                          color: CHARCOAL[400],
                          marginTop: 4,
                          paddingRight: 4,
                        }}
                      >
                        {message.time} {"  "}
                        <span style={{ color: SEMANTIC.success }}>✓✓</span>
                      </div>
                    </div>
                  )}

                  {/* Provider message timestamp */}
                  {!isClient && (
                    <div
                      style={{
                        fontSize: 11,
                        color: CHARCOAL[400],
                        marginTop: 4,
                        paddingLeft: 38,
                      }}
                    >
                      {message.time}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {showTyping && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                }}
              >
                <Avatar size={28} initial="M" />
                <div
                  style={{
                    backgroundColor: CHARCOAL[50],
                    borderRadius: "16px 16px 16px 4px",
                    padding: "12px 18px",
                    display: "flex",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: CHARCOAL[300],
                    }}
                  />
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: CHARCOAL[300],
                      opacity: 0.7,
                    }}
                  />
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: CHARCOAL[300],
                      opacity: 0.4,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Composer bar */}
          <div
            style={{
              padding: "16px 32px",
              borderTop: `1px solid ${CHARCOAL[100]}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: CHARCOAL[50],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: CHARCOAL[400],
                flexShrink: 0,
              }}
            >
              +
            </div>
            <div
              style={{
                flex: 1,
                height: 40,
                borderRadius: 20,
                backgroundColor: CHARCOAL[50],
                border: `1px solid ${CHARCOAL[200]}`,
                display: "flex",
                alignItems: "center",
                paddingLeft: 16,
                fontSize: 14,
                color: CHARCOAL[400],
              }}
            >
              Type a message...
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: HONEY[500],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: CHARCOAL[900],
                flexShrink: 0,
              }}
            >
              ↑
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
