# Feedback Pipeline

Automated pipeline that aggregates customer feedback from a Slack channel into a centralized Google Sheet, with keyword-based sentiment classification, deduplication, and status tracking.

## Problem

Customer feedback was scattered across a Slack channel with no structured way to track, prioritize, or close the loop on individual items. This pipeline centralizes that feedback into a single, filterable, sortable source of truth for the product team.

## How it works

1. **Trigger**: a time-based Apps Script trigger polls a Slack channel's message history via the Slack Web API (`conversations.history`).
2. **Filtering**: system messages (joins, channel renames, bot messages) are filtered out before processing.
3. **Sentiment tagging**: each message is scanned against curated positive/negative keyword lists to assign a lightweight sentiment label. This is intentionally simple and dependency-free so it runs entirely inside Apps Script's execution limits.
4. **Deduplication**: messages are keyed by Slack `ts` (timestamp) plus channel ID, checked against already-logged rows before insertion, so re-runs never create duplicate entries.
5. **Sheet write**: new feedback rows are appended to Google Sheets with columns for date, author, message, sentiment, and status.
6. **Status tracking**: the Status column (`New` / `In Review` / `Done`) is manually editable by the product team and drives a simple Kanban-style view built on top of the sheet via filter views.

## Stack

- Google Apps Script (JavaScript, V8 runtime)
- Slack Web API
- Google Sheets API (via `SpreadsheetApp`)
- OAuth 2.0 (bot token scopes: `channels:history`, `channels:read`)

## Setup

1. Create a Slack app with `channels:history` and `channels:read` bot scopes, install it to your workspace, and invite the bot to the target channel.
2. Store the bot token in Apps Script's Script Properties as `SLACK_BOT_TOKEN`.
3. Set `CHANNEL_ID` and `SHEET_ID` in `Config.gs`.
4. Add a time-driven trigger on `syncFeedback` (e.g. every 15 minutes).

## Notes

This is a rebuilt, standalone demo of a pipeline originally developed for internal product use at a previous employer. Channel IDs, tokens, and sheet structure have been generalized for public sharing.
