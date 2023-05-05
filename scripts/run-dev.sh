#!/bin/bash
#  ██████╗ ██╗ ██████╗ ███╗   ██╗███████╗███████╗██████╗      █████╗ ██╗
#  ██╔══██╗██║██╔═══██╗████╗  ██║██╔════╝██╔════╝██╔══██╗    ██╔══██╗██║
#  ██████╔╝██║██║   ██║██╔██╗ ██║█████╗  █████╗  ██████╔╝    ███████║██║
#  ██╔═══╝ ██║██║   ██║██║╚██╗██║██╔══╝  ██╔══╝  ██╔══██╗    ██╔══██║██║
#  ██║     ██║╚██████╔╝██║ ╚████║███████╗███████╗██║  ██║    ██║  ██║██║
#  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝
#
#  Created for the Coinmasters Guild
#                                             -Highlander
#                                                       Fuck lerna
detect_os() {
  case "$(uname -s)" in
    Linux*)     OS=Linux;;
    Darwin*)    OS=Mac;;
    CYGWIN*)    OS=Cygwin;;
    MINGW*)     OS=MinGW;;
    *)          OS="UNKNOWN"
  esac
  echo $OS
}

run_command() {
  local cmd="cd $REPO_ROOT/$1 && yarn && yarn run dev"

  case $OS in
    Linux)
      if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --tab -- bash -c "$cmd; exec bash"
      elif command -v konsole &> /dev/null; then
        konsole --new-tab -e "bash -c '$cmd; exec bash'"
      elif command -v xfce4-terminal &> /dev/null; then
        xfce4-terminal --tab -e "bash -c '$cmd; exec bash'"
      else
        echo "Unsupported terminal emulator. Please install 'gnome-terminal', 'konsole', or 'xfce4-terminal'."
      fi
      ;;
    Mac)
      osascript -e "tell application \"Terminal\" to do script \"$cmd\""
      ;;
    *)
      echo "Unsupported operating system."
  esac
}

OS=$(detect_os)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

run_command "services/discord-bridge"
run_command "services/pioneer-bot"
run_command "services/openapi-execution-agent"
run_command "services/openapi-skill-creation-agent"
run_command "services/openapi-solver"
run_command "services/openapi-task-queue"
run_command "services/pioneer-ai-rest"
run_command "services/work-delegation-agent"
