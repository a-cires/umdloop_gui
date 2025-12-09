# Additional clean files
cmake_minimum_required(VERSION 3.16)

if("${CONFIG}" STREQUAL "" OR "${CONFIG}" STREQUAL "Debug")
  file(REMOVE_RECURSE
  "CMakeFiles\\LoopGui_autogen.dir\\AutogenUsed.txt"
  "CMakeFiles\\LoopGui_autogen.dir\\ParseCache.txt"
  "LoopGui_autogen"
  )
endif()
