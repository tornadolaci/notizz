<?php

// Diagnostic probe: runs on any PHP version, reports the runtime.
// Safe to keep - reveals nothing beyond the PHP version.
header('Content-Type: application/json');
echo json_encode(array('php' => PHP_VERSION));
