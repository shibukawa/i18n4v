package main

import (
	"go/parser"
	"gopkg.in/alecthomas/kingpin.v2"
	"github.com/shibukawa/i18n4v"
	"path"
)

var tr i18n4v.TranslatorFunction

var output *string
var goExclude *string
var fillCopy *bool
var inputPaths *[]string

func init() {
	tr = i18n4v.Select("en")

	output = kingpin.Flag("output", tr("Output file path. You can add extension .js/.json.")).Short('o').String()
	goExclude = kingpin.Flag("go-exclude", tr("Input JavaScript file filtering pattern.")).String()
	fillCopy = kingpin.Flag("fill-copy", tr("Fill key as default translation text")).Default("false").Bool()
	inputPaths = kingpin.Arg("inputs", tr("source files/dirs...")).Required().ExistingFilesOrDirs()
}

const version = "0.3.1"

func main() {
	kingpin.Parse()
}
