#!/bin/bash

# Codex CLI automation script
# Usage: ./codex-auto.sh [prompts-file]
# Default prompts file: ~/codex-prompts.txt

PROMPTS_FILE="${1:-$HOME/codex-prompts.txt}"

codex_cmd="codex --model='gpt-5.2-codex' --config='model_reasoning_effort=\"medium\"' --enable='web_search_request' --sandbox='danger-full-access' --search --enable='tui2'"

# Load prompts from file
prompts=()
if [[ -f "$PROMPTS_FILE" ]]; then
  while IFS= read -r line; do
    [[ -n "$line" ]] && prompts+=("$line")
  done < "$PROMPTS_FILE"
else
  echo "Error: Prompts file not found: $PROMPTS_FILE"
  echo "Create it with one prompt per line, or pass a file path as argument."
  exit 1
fi

echo "Loaded ${#prompts[@]} prompts from $PROMPTS_FILE"

# Launch codex in kitty window
win_id=$(kitty @ launch --type=window --hold -- bash -c "$codex_cmd")
sleep 3

for i in "${!prompts[@]}"; do
  prompt="${prompts[$i]}"
  echo "[$((i+1))/${#prompts[@]}] Sending: $prompt"
  
  kitty @ send-text --match "id:$win_id" "$prompt"
  kitty @ send-text --match "id:$win_id" "\r"
  
  sleep 3
  while kitty @ get-text --match "id:$win_id" | grep -qi "Working"; do
    sleep 2
  done
  
  echo "[$((i+1))/${#prompts[@]}] Completed"
done

echo "All ${#prompts[@]} tasks complete"
# kitty @ close-window --match "id:$win_id"  # Uncomment to auto-close
