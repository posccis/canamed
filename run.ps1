[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [switch]$SkipMigrations,
    [int]$PortFrontend = 5173,
    [int]$PortBackend = 5080
)

$PSScriptRootCurrent = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$PSScriptRootCurrent\start-canamed.ps1" @PSBoundParameters
