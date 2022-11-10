#! /usr/bin/env bash

set -e # exit on error

#set -x # trace

validPackageJson=package.json.valid
brokenPackageJson=package.json.broken

#find test/fixtures/ -name package.json | while read -r manifestPath
# some yarn2-only tests break pnpm. example: test/fixtures/specified-resolutions
# -> use npm tests to generate pnpm tests
find test/fixtures/ -name package-lock.json -not -path '*/node_modules/*' | while read -r npmLockPath
do
  #pkgDir=$(dirname $manifestPath)
  pkgDir=$(dirname $npmLockPath)
  if [ -e $pkgDir/$validPackageJson ]
  then
    # package.json is broken
    # use $validPackageJson to generate lockfile
    echo swap package.json files
    git mv $pkgDir/package.json $pkgDir/$brokenPackageJson
    ln -s $validPackageJson $pkgDir/package.json
  fi
  (
    cd $pkgDir
    
    # loop pnpm versions
    for pnpm_sh in ~/src/javascript/pnpm/test-versions/*/pnpm.sh
    do
      lockfileVersion=$(echo "$pnpm_sh" | sed -E 's,^.*/([0-9.]+)/pnpm\.sh$,\1,')
      logfileName="pnpm-lock.v${lockfileVersion}.log"
      pnpmLockName="pnpm-lock.v${lockfileVersion}.yaml"
      pnpmVersion=$(jq -r .version <"$(dirname "$pnpm_sh")"/pnpm/node_modules/pnpm/package.json)

      if [ -e $pnpmLockName ]; then echo "$pkgDir/$pnpmLockName: exists -> skip"; continue; fi # keep old lockfiles

      echo "$pkgDir: generate $pkgDir/$pnpmLockName ..."
      echo "pnpm_sh = $pnpm_sh"
      echo "lockfileVersion = $lockfileVersion"
      echo "pnpmVersion = $pnpmVersion"

      storePath=~/.pnpm-store-$pnpmVersion
      echo "storePath = $storePath"

      [ -e .shrinkwrap.yaml ] && rm .shrinkwrap.yaml
      [ -e node_modules ] && rm -rf node_modules

      # text screenshot
      # capture the visible output of a process
      # https://unix.stackexchange.com/a/697804/295986
      screenName=$(mktemp -u screen-session-XXXXXXXX)
      screen -S "$screenName" -d -m # create a new screen session. dont attach
      captureCommand="$pnpm_sh install --ignore-scripts --lockfile-only --loglevel error --store $storePath"
      screenLock=$(mktemp /tmp/screen-lock-XXXXXXXX)
      screenCommand="$captureCommand; rm $screenLock;"
      echo "start captureCommand"
      screen -S "$screenName" -X stuff "$screenCommand^M" # ^M = enter
      hardcopyFile=$(mktemp /tmp/hardcopy-XXXXXXXX)
      enableWatcher=true
      #enableWatcher=false
      if $enableWatcher; then
        echo "start watcher"
        (
          # watcher: show live output while waiting
          while true
          #for watcherStep in $(seq 0 100) # debug
          do
            sleep 10
            #echo watcher step "$watcherStep"
            echo "last output:"
            screen -S "$screenName" -X hardcopy -h "$hardcopyFile" # take screenshot. -h = include history
            #cat "$hardcopyFile"
            tail "$hardcopyFile"
            sleep 20
          done
        ) &
        watcherPid=$!
        echo "watcherPid = $watcherPid"
      fi
      echo "wait for captureCommand ..."
      while true
      #for waiterStep in $(seq 0 100) # debug
      do
        sleep 1
        #echo waiter step "$waiterStep"
        [ -e "$screenLock" ] || break
        done
      echo "done captureCommand"
      if $enableWatcher; then
        echo "stop watcher"
        kill $watcherPid
      fi
      screen -S "$screenName" -X hardcopy -h "$hardcopyFile" # take screenshot. -h = include history
      screen -S "$screenName" -X quit # kill the detached screen session
      echo "last output:"
      tail "$hardcopyFile"

      mv "$hardcopyFile" "$logfileName"
      echo "done $pkgDir/$logfileName"

      #exit # debug # this will exit only the current subshell

      #"$pnpm_sh" install --ignore-scripts --lockfile-only --loglevel error --store "$storePath"
      # 2>&1 | tee "$logfileName"
      # TODO use a `tee` that can "parse" line-clearing with \r

      #"$pnpm_sh" install 2>&1 | tee "$logfileName"; rm -rf node_modules
      if [[ -e "pnpm-lock.yaml" || -e "shrinkwrap.yaml" ]]
      then
        mv "pnpm-lock.yaml" "$pnpmLockName" || mv "shrinkwrap.yaml" "$pnpmLockName"
        echo "done $pkgDir/$pnpmLockName"
      else
        echo "no lockfile for $pkgDir/ -> create empty $pkgDir/$pnpmLockName"
        touch $pnpmLockName
      fi
    done
  ) # cd $pkgDir
  if [ -e $pkgDir/$validPackageJson ]
  then
    echo unswap package.json files
    rm $pkgDir/package.json
    git mv $pkgDir/$brokenPackageJson $pkgDir/package.json
  fi
  echo
done
